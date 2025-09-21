"use strict";

const _ = require("lodash");
const { BadRequestError } = require("../core/error.response");

const getInfoData = (fields = [], object = {}) => {
  return _.pick(object, fields);
};

const removeNull = (object) => {
  return _.omitBy(object, _.isNil);
};


const checkRequestParams = (parameters = {}) => {
  for (const [key, value] of Object.entries(parameters)) {
    if(value === undefined || value === "") {
      throw new BadRequestError(`${key} is not allowed empty or undefined1`);
    }
  }
};

const flattenNestedObject = (object = {}, field) => {
  return _.merge(_.get(object, field), _.omit(object, field));
};


const getValues = (object, key) => _.map(object, key);

const extractFields = (array, fieldPath) => {
  return _.map(array, item => _.get(item, fieldPath));
}

module.exports = {
  getInfoData,
  removeNull,
  getValues,
  checkRequestParams,
  flattenNestedObject,
  extractFields
};
