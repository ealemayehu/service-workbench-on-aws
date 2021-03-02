/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 *  or in the "license" file accompanying this file. This file is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *  express or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */

const { runSetup } = require('../../../support/setup');
const errorCode = require('../../../support/utils/error-code');

const {
  createWorkspaceTypeAndConfiguration,
} = require('../../../support/complex/create-workspace-type-and-configuration');

describe('Cidr workspace-service-catalog scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Cidr workspace-service-catalog', () => {
    it('should fail if user is inactive', async () => {
      const adminSession2 = await setup.createAdminSession();
      const workspaceName = setup.gen.string({ prefix: 'workspace-service-catalog-test' });
      const { workspaceTypeId, configurationId } = await createWorkspaceTypeAndConfiguration(adminSession, setup);

      await adminSession.resources.users.deactivateUser(adminSession2.user);

      const response = await adminSession.resources.workspaceServiceCatalogs.create({
        name: workspaceName,
        envTypeId: workspaceTypeId,
        envTypeConfigId: configurationId,
      });

      const cidrs = [{ fromPort: 10, toPort: 20, protocol: 'http', cidrBlocks: ['0.0.0.0/32'] }];

      await expect(
        adminSession2.resources.workspaceServiceCatalogs.workspaceServiceCatalog(response.id).cidr(cidrs),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail if user is anonymous', async () => {
      const anonymousSession = await setup.createAnonymousSession();
      const workspaceName = setup.gen.string({ prefix: 'workspace-service-catalog-test' });
      const { workspaceTypeId, configurationId } = await createWorkspaceTypeAndConfiguration(adminSession, setup);

      const response = await adminSession.resources.workspaceServiceCatalogs.create({
        name: workspaceName,
        envTypeId: workspaceTypeId,
        envTypeConfigId: configurationId,
      });

      const cidrs = [{ fromPort: 10, toPort: 20, protocol: 'http', cidrBlocks: ['0.0.0.0/32'] }];

      await expect(
        anonymousSession.resources.workspaceServiceCatalogs.workspaceServiceCatalog(response.id).cidr(cidrs),
      ).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
    });
  });
});