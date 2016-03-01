var MongoClient = require('mongodb').MongoClient;

/*
EXAMPLE
multivarka.server('mongodb://localhost:27017/test')
    .collection('students')
    .where('grade')
    .not()
    .lessThan(4)
    .find(function (error, data) {
        if (error) {
            console.log('Error');
            console.log(error);
        } else {
            console.log(data);
        }
    });
 */

var multivarka = {
    server: function (serverAddr) {
        return {
            server: serverAddr,
            collection: function (collectionName) {
                var collectionObject = {
                    collection: collectionName,
                    where: function (variableName) {
                        var whereQueryObject = {
                            variable: variableName,
                            equal: function (value) {
                                var equalExpressionObject = {
                                    value: value,
                                    type: 'equal'
                                };
                                Object.setPrototypeOf(equalExpressionObject, this);
                                return equalExpressionObject;
                            },
                            include: function (valuesList) {
                                var includeExpressionObject = {
                                    includeValues: valuesList,
                                    type: 'include'
                                };
                                Object.setPrototypeOf(includeExpressionObject, this);
                                return includeExpressionObject;
                            },
                            not: function () {
                                var negativeQueryObject = { negation: true };
                                Object.setPrototypeOf(negativeQueryObject, this);
                                return negativeQueryObject;
                            },
                            greatThan: function (value) {
                                var greatExpressionObject = {
                                    value: value,
                                    type: 'great'
                                };
                                Object.setPrototypeOf(greatExpressionObject, this);
                                return greatExpressionObject;
                            },
                            lessThan: function (value) {
                                var lessExpressionObject = {
                                    value: value,
                                    type: 'less'
                                };
                                Object.setPrototypeOf(lessExpressionObject, this);
                                return lessExpressionObject;
                            },
                            find: function (callback) {
                                var mongoQuery = createMongoQuery(this);
                                var _this = this;
                                MongoClient.connect(_this.server, function (err, db) {
                                    if (err) {
                                        callback(err);
                                        return;
                                    }
                                    var collection = db.collection(_this.collection);
                                    collection
                                        .find(mongoQuery)
                                        .toArray()
                                        .then(function (result) {
                                            db.close();
                                            callback(undefined, result);
                                        });
                                });
                            }
                        };
                        Object.setPrototypeOf(whereQueryObject, this);
                        return whereQueryObject;
                    }
                };
                Object.setPrototypeOf(collectionObject, this);
                return collectionObject;
            }
        };
    }
};

function createMongoQuery(multivarkaQuery) {
    var variable = multivarkaQuery.variable;
    var queryType = multivarkaQuery.type;
    var mongoQuery = {};
    var negation = multivarkaQuery.negation;
    var marker;
    switch (queryType) {
        case 'equal':
            if (negation) {
                mongoQuery[variable] = { $ne: multivarkaQuery.value };
            } else {
                mongoQuery[variable] = multivarkaQuery.value;
            }
            break;
        case 'include':
            marker = negation ? '$nin' : '$in';
            mongoQuery[variable] = {};
            mongoQuery[variable][marker] = multivarkaQuery.includeValues;
            break;
        case 'great':
            marker = negation ? '$lte' : '$gt';
            mongoQuery[variable] = {};
            mongoQuery[variable][marker] = multivarkaQuery.value;
            break;
        case 'less':
            marker = negation ? '$gte' : '$lt';
            mongoQuery[variable] = {};
            mongoQuery[variable][marker] = multivarkaQuery.value;
            break;
    }
    return mongoQuery;
}

module.exports = multivarka;
