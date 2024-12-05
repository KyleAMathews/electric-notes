/// <reference path="./.sst/platform/config.d.ts" />

export function createExampleDbAndAddtoElectric({ name }: { name: string }) {
  const NEON_ELECTRIC_EXAMPLES_ID = `dry-sea-41172759`;
  const project = neon.getProjectOutput({ id: NEON_ELECTRIC_EXAMPLES_ID });

  const db = new neon.Database(`${name}-${$app.stage}`, {
    projectId: project.id,
    branchId: project.defaultBranchId,
    name:
      $app.stage === `Production`
        ? `${name}-production`
        : `${name}-${$app.stage}`,
    ownerName: `neondb_owner`,
  });
  const { pooledDb, databaseUri } = getNeonDbUri(project, db);

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

function getNeonDbUri(
  project: $util.Output<neon.GetProjectResult>,
  db: neon.Database,
) {
  const passwordOutput = neon.getBranchRolePasswordOutput({
    projectId: project.id,
    branchId: project.defaultBranchId,
    roleName: db.ownerName,
  });

  return {
    databaseUri: $interpolate`postgresql://${passwordOutput.roleName}:${passwordOutput.password}@${project.databaseHost}/${db.name}?sslmode=require`,
    pooledDb: $interpolate`postgresql://${passwordOutput.roleName}:${passwordOutput.password}@${project.databaseHost.apply((host) => host.replace(`.us-east`, `-pooler.us-east`))}/${db.name}?sslmode=require`,
  };
}

async function addDatabaseToElectric(
  uri: string,
): Promise<{ id: string; token: string }> {
  const adminApi = `https://admin-api-dev-production.electric-sql.com`;

  const result = await fetch(`${adminApi}/v1/databases`, {
    method: `PUT`,
    headers: { "Content-Type": `application/json` },
    body: JSON.stringify({
      database_url: uri,
      region: `us-east-1`,
    }),
  });

  if (!result.ok) {
    throw new Error(
      `Could not add database to Electric (${result.status}): ${await result.text()}`,
    );
  }

  return await result.json();
}
