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
}

export default UuidAliasManager;
