import request from 'request-promise-native';

class UuidAliasManager {
  constructor(aliasServerUri) {
    this.aliasServerUri = aliasServerUri;
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
}

export default UuidAliasManager;
