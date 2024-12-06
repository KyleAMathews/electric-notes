import { toBase64, fromBase64 } from "lib0/buffer";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { ObservableV2 } from "lib0/observable";
import * as env from "lib0/environment";
import * as Y from "yjs";
import {
  FetchError,
  isChangeMessage,
  isControlMessage,
  Message,
  ShapeStream,
} from "@electric-sql/client";
import { parseToDecoder } from "./utils";

type OperationMessage = {
  op: decoding.Decoder;
  note_id: number;
};

type AwarenessMessage = {
  op: decoding.Decoder;
  clientId: string;
  note_id: number;
};

type ObservableProvider = {
  sync: (state: boolean) => void;
  synced: (state: boolean) => void;
  status: (status: {
    status: "connecting" | "connected" | "disconnected";
  }) => void;
  "connection-close": () => void;
};

const messageSync = 0;

export class ElectricProvider extends ObservableV2<ObservableProvider> {
  private serverUrl: string;
  public noteId: string;
  public doc: Y.Doc;
  public awareness?: awarenessProtocol.Awareness;

  private operationsStream?: ShapeStream<OperationMessage>;
  private awarenessStream?: ShapeStream<AwarenessMessage>;

  private shouldConnect: boolean;
  private connected: boolean;
  private _synced: boolean;

  private modifiedWhileOffline: boolean;
  private lastSyncedStateVector?: Uint8Array;

  private updateHandler: (update: Uint8Array, origin: unknown) => void;
  private awarenessUpdateHandler?: (
    changed: { added: number[]; updated: number[]; removed: number[] },
    origin: string,
  ) => void;
  private disconnectHandler?: () => void;
  private exitHandler?: () => void;

  constructor(
    serverUrl: string,
    noteId: string,
    doc: Y.Doc,
    options: { awareness?: awarenessProtocol.Awareness; connect?: boolean },
  ) {
    super();

    this.serverUrl = serverUrl;
    this.noteId = noteId;

    this.doc = doc;
    this.awareness = options.awareness;

    this.connected = false;
    this._synced = false;
    this.shouldConnect = options.connect ?? false;

    this.modifiedWhileOffline = false;

    this.updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin !== this) {
        this.sendOperation(update);
      }
    };
    this.doc.on("update", this.updateHandler);

    if (this.awareness) {
      this.awarenessUpdateHandler = ({ added, updated, removed }, origin) => {
        if (origin === "local") {
          const changedClients = added.concat(updated).concat(removed);
          this.sendAwareness(changedClients);
        }
      };
      this.awareness.on("update", this.awarenessUpdateHandler);
    }

    if (env.isNode && typeof process !== "undefined") {
      this.exitHandler = () => {
        if (this.awareness) {
          awarenessProtocol.removeAwarenessStates(
            this.awareness,
            [doc.clientID],
            "app closed",
          );
        }
        process.on("exit", () => this.exitHandler!());
      };
    }

    if (options.connect) {
      this.connect();
    }
  }

  private get operationsUrl() {
    return this.serverUrl + "/notes-operations";
  }

  private get awarenessUrl() {
    return this.serverUrl + "/awareness";
  }

  get synced() {
    return this._synced;
  }

  set synced(state) {
    if (this._synced !== state) {
      this._synced = state;
      this.emit("synced", [state]);
      this.emit("sync", [state]);
    }
  }

  destroy() {
    this.disconnect();
    this.doc.off("update", this.updateHandler);
    this.awareness?.off("update", this.awarenessUpdateHandler!);
    if (env.isNode && typeof process !== "undefined") {
      process.off("exit", this.exitHandler!);
    }
    super.destroy();
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.disconnectHandler) {
      this.disconnectHandler();
    }
  }

  connect() {
    this.shouldConnect = true;
    if (!this.connected && !this.operationsStream) {
      this.setupShapeStream();
    }
  }

  private async retryFetch(
    url: URL,
    options: RequestInit,
    maxBackoff = 20000,
  ): Promise<Response> {
    let backoff = 1000; // Start with 1 second

    while (true) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
      } catch (error) {
        console.error("Fetch error:", error);

        // Wait before retrying, with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, backoff));

        // Increase backoff, but cap at maxBackoff
        backoff = Math.min(backoff * 2, maxBackoff);
      }
    }
  }

  private sendOperation(update: Uint8Array) {
    if (update.length <= 2) {
      throw Error(
        "Shouldn't be trying to send operations without pending operations",
      );
    }

    if (!this.connected) {
      this.modifiedWhileOffline = true;
      return Promise.resolve();
    }

    const encoder = encoding.createEncoder();
    syncProtocol.writeUpdate(encoder, update);
    const op = toBase64(encoding.toUint8Array(encoder));
    const note_id = this.noteId;

    return this.retryFetch(
      new URL("/v1/note-operation", this.serverUrl),
      {
        method: "POST",
        headers: {
          "content-type": `application/json`,
        },
        body: JSON.stringify({ note_id, op }),
      },
    );
  }

  private sendAwareness(changedClients: number[]) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness!, changedClients),
    );
    const op = toBase64(encoding.toUint8Array(encoder));

    if (this.connected) {
      const note_id = this.noteId;
      const clientId = `${this.doc.clientID}`;

      return this.retryFetch(
        new URL("/v1/note-operation", this.serverUrl),
        {
          method: "POST",
          headers: {
            "content-type": `application/json`,
          },
          body: JSON.stringify({ clientId, note_id, op }),
        },
      );
    }
  }

  private setupShapeStream() {
    if (this.shouldConnect && !this.operationsStream) {
      this.connected = false;
      this.synced = false;

      this.operationsStream = new ShapeStream<OperationMessage>({
        url: this.operationsUrl,
        params: {
          where: `note_id = ${this.noteId}`,
        },
        parser: parseToDecoder,
      });

      // this.awarenessStream = new ShapeStream({
      //   url: this.awarenessUrl,
      //   params: {
      //     where: `note_id = ${this.noteId}`,
      //   },
      //   parser: parseToDecoder,
      // });

      const errorHandler = (e: FetchError | Error) => {
        throw e;
      };

      const handleSyncMessage = (messages: Message<OperationMessage>[]) => {
        messages.forEach((message) => {
          if (isChangeMessage(message) && message.value.op) {
            const decoder = message.value.op;
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            syncProtocol.readSyncMessage(
              decoder,
              encoder,
              this.doc,
              this,
            );
          } else if (
            isControlMessage(message) &&
            message.headers.control === "up-to-date"
          ) {
            this.synced = true;
          }
        });
      };

      const unsubscribeSyncHandler = this.operationsStream.subscribe(
        handleSyncMessage,
        errorHandler,
      );

      const handleAwarenessMessage = (
        messages: Message<AwarenessMessage>[],
      ) => {
        messages.forEach((message) => {
          if (isChangeMessage(message) && message.value.op) {
            const decoder = message.value.op;
            awarenessProtocol.applyAwarenessUpdate(
              this.awareness!,
              decoding.readVarUint8Array(decoder),
              this,
            );
          }
        });
      };

      // const unsubscribeAwarenessHandler = this.awarenessStream.subscribe(
      //   handleAwarenessMessage,
      //   errorHandler,
      // );

      this.disconnectHandler = () => {
        this.operationsStream = undefined;
        // this.awarenessStream = undefined;

        if (this.connected) {
          this.connected = false;

          this.synced = false;

          if (this.awareness) {
            awarenessProtocol.removeAwarenessStates(
              this.awareness,
              Array.from(this.awareness.getStates().keys()).filter(
                (client) => client !== this.doc.clientID,
              ),
              this,
            );
          }
          this.lastSyncedStateVector = Y.encodeStateVector(this.doc);
          this.emit("status", [{ status: "disconnected" }]);
        }

        unsubscribeSyncHandler();
        unsubscribeAwarenessHandler();
        this.disconnectHandler = undefined;
        this.emit("connection-close", []);
      };

      // send pending changes
      const unsubscribeOps = this.operationsStream!.subscribe(() => {
        this.connected = true;

        if (this.modifiedWhileOffline) {
          const pendingUpdates = Y.encodeStateAsUpdate(
            this.doc,
            this.lastSyncedStateVector,
          );
          const encoderState = encoding.createEncoder();
          syncProtocol.writeUpdate(encoderState, pendingUpdates);

          this.sendOperation(pendingUpdates)
            .then(() => {
              this.lastSyncedStateVector = undefined;
              this.modifiedWhileOffline = false;
              this.emit("status", [{ status: "connected" }]);
            })
            .catch(console.error);
        }
        unsubscribeOps();
      });

      if (this.awarenessStream) {
        const unsubscribeAwareness = this.awarenessStream.subscribe(() => {
          if (this.awareness!.getLocalState() !== null) {
            this.sendAwareness([this.doc.clientID])?.catch(console.error);
          }
          unsubscribeAwareness();
        });
      }

      this.emit("status", [{ status: "connecting" }]);
    }
  }
}
