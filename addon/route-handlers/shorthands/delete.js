import BaseShorthandRouteHandler from './base';
import { pluralize } from 'ember-cli-mirage/utils/inflector';
import Db from 'ember-cli-mirage/db';

export default class DeleteShorthandRouteHandler extends BaseShorthandRouteHandler {

  /*
    Remove the model from the db of type *type*.

    This would remove the user with id :id:
      Ex: this.stub('delete', '/contacts/:id', 'user');
  */
  handleStringShorthand(modelName, dbOrSchema, request) {
    var id = this._getIdForRequest(request);
    var collection = pluralize(modelName);

    if (dbOrSchema instanceof Db) {
      let db = dbOrSchema;
      if (!db[collection]) {
        throw new Error("Mirage: The route handler for " + request.url + " is trying to remove data from the " + collection + " collection, but that collection doesn't exist. To create it, create an empty fixture file or factory.");
      }

      db[collection].remove(id);
    } else {
      let schema = dbOrSchema;

      return schema[modelName].find(id).destroy();
    }
  }

  /*
    Remove the model and child related models from the db.

    This would remove the contact with id `:id`, and well
    as this contact's addresses and phone numbers.
      Ex: this.stub('delete', '/contacts/:id', ['contact', 'addresses', 'numbers');
  */
  handleArrayShorthand(array, dbOrSchema, request) {
    var id = this._getIdForRequest(request);
    var parentType = array[0];
    var parentCollection = pluralize(parentType);
    var types = array.slice(1);

    if (dbOrSchema instanceof Db) {
      let db = dbOrSchema;
      if (!db[parentCollection]) {
        throw new Error("Mirage: The route handler for " + request.url + " is trying to remove data from the " + parentCollection + " collection, but that collection doesn't exist. To create it, create an empty fixture file or factory.");
      }

      db[parentCollection].remove(id);

      var query = {};
      var parentIdKey = parentType + '_id';
      query[parentIdKey] = id;

      types.forEach(function(type) {
        var collection = pluralize(type);

        if (!db[collection]) {
          throw new Error("Mirage: The route handler for " + request.url + " is trying to remove data from the " + collection + " collection, but that collection doesn't exist. To create it, create an empty fixture file or factory.");
        }

        db[collection].remove(query);
      });

    } else {
      let schema = dbOrSchema;

      let parent = schema[parentType].find(id);

      // Delete related children
      types.forEach(type => {
        parent[type].destroy();
      });

      // Delete the parent
      parent.destroy();
    }
  }

}