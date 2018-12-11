import request from 'request-promise-native';

class UuidAliasManager {
  constructor(aliasServerUri, uuidAliasResolver) {
    this.aliasServerUri = aliasServerUri;
    this.uuidAliasResolver = uuidAliasResolver;
  }

  async create(credentials, name, uuid) {
    const url = `${this.aliasServerUri}/aliases`;
    const headers = {
      meshblu_auth_uuid: credentials.uuid,
      meshblu_auth_token: credentials.token,
    };

    await request.post({
      url, headers, body: { name, uuid }, json: true,
    });
  }

  async remove(credentials, name) {
    const url = `${this.aliasServerUri}/aliases/${name}`;
    const headers = {
      meshblu_auth_uuid: credentials.uuid,
      meshblu_auth_token: credentials.token,
    };

    await request.delete({
      url, headers,
    });
  }

  async resolve(alias) {
    return new Promise((resolve, reject) => {
      this.uuidAliasResolver.resolve(alias, (error, uuid) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(uuid);
      });
    });
  }
}

export default UuidAliasManager;
