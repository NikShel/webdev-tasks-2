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
        this.serverAddr = serverAddr;
        return this;
    },
    collection: function (collectionName) {
        this.collectionName = collectionName;
        this.query = {};
        return this;
    },
    where: function (variable) {
        this.currentVariable = variable;
        this.negation = false;
        return this;
    },
    not: function () {
        this.negation = true;
        return this;
    },
    _addQuery: function (type) {
        var variable = this.currentVariable;
        var currentQuery = {
            variable: this.currentVariable,
            negation: this.negation,
            type: type,
            value: this.currentValue
        };
        if (this.query[variable] === undefined) {
            this.query[variable] = [currentQuery];
        } else {
            this.query[variable].push(currentQuery);
        }
        this.negation = false;
    },
    equal: function (value) {
        this.currentValue = value;
        this._addQuery('equal');
        return this;
    },
    lessThan: function (value) {
        this.currentValue = value;
        this._addQuery('less');
        return this;
    },
    greatThan: function (value) {
        this.currentValue = value;
        this._addQuery('great');
        return this;
    },
    include: function (values) {
        this.currentValue = values;
        this._addQuery('include');
        return this;
    },
    find: function (callback) {
        var mongoQuery = createMongoQuery(this.query);
        var _this = this;
        MongoClient.connect(_this.serverAddr, function (err, db) {
            if (err) {
                callback(err);
                return;
            }
            var collection = db.collection(_this.collectionName);
            collection
                .find(mongoQuery)
                .toArray()
                .then(function (result) {
                    db.close();
                    callback(null, result);
                });
        });
    }
};

function createMongoQuery(multivarkaQuery) {
    var mongoQuery = {};
    Object.keys(multivarkaQuery).forEach(function (variable) {
        var variableQueries = multivarkaQuery[variable];
        var queryPart = {};
        if (variableQueries.length == 1) {
            queryPart = convertMongoQueryPart(variableQueries[0]);
        } else {
            queryPart = {
                $and: variableQueries.map(convertMongoQueryPart)
            };
        }
        Object.assign(mongoQuery, queryPart);
    });
    return mongoQuery;
}

function convertMongoQueryPart(multivarkaQueryPart) {
    var mongoQueryPart = {};
    var variable = multivarkaQueryPart.variable;
    var queryType = multivarkaQueryPart.type;
    var negation = multivarkaQueryPart.negation;
    var value = multivarkaQueryPart.value;

    var marker;
    switch (queryType) {
        case 'equal':
            if (negation) {
                mongoQueryPart[variable] = { $ne: value };
            } else {
                mongoQueryPart[variable] = value;
            }
            break;
        case 'include':
            marker = negation ? '$nin' : '$in';
            mongoQueryPart[variable] = {};
            mongoQueryPart[variable][marker] = value;
            break;
        case 'great':
            marker = negation ? '$lte' : '$gt';
            mongoQueryPart[variable] = {};
            mongoQueryPart[variable][marker] = value;
            break;
        case 'less':
            marker = negation ? '$gte' : '$lt';
            mongoQueryPart[variable] = {};
            mongoQueryPart[variable][marker] = value;
            break;
    }
    return mongoQueryPart;
}

module.exports = multivarka;
