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
        this.query = [];
        return this;
    },
    where: function (variable) {
        this.currentVariable = variable;
        return this;
    },
    not: function () {
        this.negation = true;
        return this;
    },
    _addQuery: function (type) {
       this.query.push({
            variable: this.currentVariable,
            negation: this.negation,
            type: type,
            value: this.currentValue
        });
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
        console.log(mongoQuery);
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

function createMongoQuery(multivarkaQueries) {
    var mongoQuery = {};
    multivarkaQueries.forEach(function (queryItem) {
        var variable = queryItem.variable;
        var queryType = queryItem.type;
        var negation = queryItem.negation;
        var value = queryItem.value;

        var marker;
        switch (queryType) {
            case 'equal':
                if (negation) {
                    mongoQuery[variable] = { $ne: value };
                } else {
                    mongoQuery[variable] = value;
                }
                break;
            case 'include':
                marker = negation ? '$nin' : '$in';
                mongoQuery[variable] = {};
                mongoQuery[variable][marker] = value;
                break;
            case 'great':
                marker = negation ? '$lte' : '$gt';
                mongoQuery[variable] = {};
                mongoQuery[variable][marker] = value;
                break;
            case 'less':
                marker = negation ? '$gte' : '$lt';
                mongoQuery[variable] = {};
                mongoQuery[variable][marker] = value;
                break;
        }
    });
    return mongoQuery;
}

module.exports = multivarka;
