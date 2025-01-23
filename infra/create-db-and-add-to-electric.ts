/// <reference path="./.sst/platform/config.d.ts" />

let databaseUri: $util.Input<string>;
let pooledDb: $util.Input<string>;
export function createExampleDbAndAddtoElectric({ name }: { name: string }) {
  const NEON_PROJECT_ID = `dry-sea-41172759`;
  const project = neon.getProjectOutput({ id: NEON_PROJECT_ID });

  const ownerName = `neondb_owner`;
  const dbName = `${$app.name}-${$app.stage}`;

  if ($app.stage !== `production`) {
    const { ownerName, dbName: resultingDbName } = createNeonDb({
      projectId: project.id,
      branchId: project.defaultBranchId,
      dbName,
    });
    databaseUri = getNeonConnectionString({
      project,
      roleName: ownerName,
      databaseName: resultingDbName,
      pooled: false,
    });
    pooledDb = getNeonConnectionString({
      project,
      roleName: ownerName,
      databaseName: resultingDbName,
      pooled: true,
    });
  } else {
    databaseUri = getNeonConnectionString({
      project,
      roleName: ownerName,
      databaseName: dbName,
      pooled: false,
    });
    pooledDb = getNeonConnectionString({
      project,
      roleName: ownerName,
      databaseName: dbName,
      pooled: true,
    });
  }

  // const db = new neon.Database(`${name}-${$app.stage}`, {
  //   projectId: project.id,
  //   branchId: project.defaultBranchId,
  //   name:
  //     $app.stage === `Production`
  //       ? `${name}-production`
  //       : `${name}-${$app.stage}`,
  //   ownerName: `neondb_owner`,
  // });
  // const { pooledDb, databaseUri } = getNeonDbUri(project, db);
  //
  const electricInfo = databaseUri.apply((uri) => addDatabaseToElectric(uri));
  electricInfo.apply(console.log);

  const electricInfoLink = new sst.Linkable(`electricInfo`, {
    properties: {
      database_id: electricInfo.id,
      token: electricInfo.token,
    },
  });

  const databaseUriLink = new sst.Linkable(`databaseUriLink`, {
    properties: {
      url: databaseUri,
      pooledUrl: pooledDb,
    },
  });

  return { electricInfo: electricInfoLink, databaseUri: databaseUriLink };
}

// function getNeonDbUri(
//   project: $util.Output<neon.GetProjectResult>,
//   db: neon.Database,
// ) {
//   const passwordOutput = neon.getBranchRolePasswordOutput({
//     projectId: project.id,
//     branchId: project.defaultBranchId,
//     roleName: db.ownerName,
//   });
//
//   return {
//     databaseUri: $interpolate`postgresql://${passwordOutput.roleName}:${passwordOutput.password}@${project.databaseHost}/${db.name}?sslmode=require`,
//     pooledDb: $interpolate`postgresql://${passwordOutput.roleName}:${passwordOutput.password}@${project.databaseHost.apply((host) => host.replace(`.us-east`, `-pooler.us-east`))}/${db.name}?sslmode=require`,
//   };
// }

async function addDatabaseToElectric(
  uri: string,
): Promise<{ id: string; token: string }> {
  const adminApi = `https://admin-api.electric-sql.cloud`;

  const result = await fetch(`${adminApi}/v1/sources`, {
    method: `PUT`,
    headers: { "Content-Type": `application/json` },
    body: JSON.stringify({
      database_url: uri,
      region: `us-east-1`,
      team_id: `d2c34c12-a9c3-4f89-9e9c-c234fd5c3f89`,
    }),
  });

  if (!result.ok) {
    throw new Error(
      `Could not add database to Electric (${result.status}): ${await result.text()}`,
    );
  }

  return await result.json();
}

function getNeonConnectionString({
  project,
  roleName,
  databaseName,
  pooled,
}: {
  project: $util.Output<neon.GetProjectResult>;
  roleName: $util.Input<string>;
  databaseName: $util.Input<string>;
  pooled: boolean;
}): $util.Output<string> {
  const passwordOutput = neon.getBranchRolePasswordOutput({
    projectId: project.id,
    branchId: project.defaultBranchId,
    roleName: roleName,
  });

  const endpoint = neon.getBranchEndpointsOutput({
    projectId: project.id,
    branchId: project.defaultBranchId,
  });
  const databaseHost = pooled
    ? endpoint.endpoints?.apply((endpoints) =>
        endpoints![0].host.replace(
          endpoints![0].id,
          endpoints![0].id + `-pooler`,
        ),
      )
    : project.databaseHost;
  return $interpolate`postgresql://${passwordOutput.roleName}:${passwordOutput.password}@${databaseHost}/${databaseName}?sslmode=require`;
}

/**
 * Uses the [Neon API](https://neon.tech/docs/manage/databases) along with
 * a Pulumi Command resource and `curl` to create and delete Neon databases.
 */
function createNeonDb({
  projectId,
  branchId,
  dbName,
}: {
  projectId: $util.Input<string>;
  branchId: $util.Input<string>;
  dbName: $util.Input<string>;
}): $util.Output<{
  dbName: string;
  ownerName: string;
}> {
  if (!process.env.NEON_API_KEY) {
    throw new Error(`NEON_API_KEY is not set`);
  }

  const ownerName = `neondb_owner`;

  const createCommand = `curl -f "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases" \
    -H 'Accept: application/json' \
    -H "Authorization: Bearer $NEON_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
      "database": {
        "name": "'$DATABASE_NAME'",
        "owner_name": "${ownerName}"
      }
    }' 2>&1 \
    && echo " SUCCESS" || echo " FAILURE - Response: $?"`;

  const updateCommand = `echo "Cannot update Neon database with this provisioning method SUCCESS"`;

  const deleteCommand = `curl -f -X 'DELETE' \
    "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases/$DATABASE_NAME" \
    -H 'Accept: application/json' \
    -H "Authorization: Bearer $NEON_API_KEY" 2>&1 \
    && echo " SUCCESS" || echo " FAILURE - Response: $?"`;

  const result = new command.local.Command(`neon-db-command:${dbName}`, {
    create: createCommand,
    update: updateCommand,
    delete: deleteCommand,
    environment: {
      NEON_API_KEY: process.env.NEON_API_KEY,
      PROJECT_ID: projectId,
      BRANCH_ID: branchId,
      DATABASE_NAME: dbName,
    },
  });
  return $resolve([result.stdout, dbName]).apply(([stdout, dbName]) => {
    if (stdout.endsWith(`SUCCESS`)) {
      console.log(`Created Neon database ${dbName}`);
      return {
        dbName,
        ownerName,
      };
    } else {
      throw new Error(`Failed to create Neon database ${dbName}: ${stdout}`);
    }
  });
}
