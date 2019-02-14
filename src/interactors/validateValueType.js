import _ from 'lodash';
import isBase64 from 'is-base64';
import throwError from './throwError';

export default function validateValueType(device, data) {
  const schema = device.schema.find(value => value.sensorId === data.sensorId);

  if (!schema) {
    throwError(`The thing ${device.id} has no schema for sensor id ${data.sensorId}`, 403);
  }

  switch (schema.valueType) {
    case 1:
      if (!_.isInteger(data.value)) {
        throwError('Value is not integer', 403);
      }
      break;
    case 2:
      if (!_.isNumber(data.value) || _.isNaN(data.value)) {
        throwError('Value is not float', 403);
      }
      break;
    case 3:
      if (!_.isBoolean(data.value)) {
        throwError('Value is not boolean', 403);
      }
      break;
    case 4:
      if (!isBase64(data.value)) {
        throwError('Value is not in base 64', 403);
      }
      break;
    default:
      break;
  }
}
