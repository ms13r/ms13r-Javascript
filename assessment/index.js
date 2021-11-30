const _authorFileData = require('./data/authors.json');
const _recipeFileData = require('./data/recipes.json');
const _specialtyFileData = require('./data/specialties.json');

exports.handler = async (event) => {
    // Configure variables for later use
    let authors = null;
    let specialties = null;
    let pages = 0;
    let pageSize = 0;
    let body = {};
    let totalResults = 0;
    let returnItems = [];

    try {
        if (event.multiValueQueryStringParameters) {
            // AWS API support for multiple query string params for the same item is supported
            // Parse through each of the query items
            authors = event.multiValueQueryStringParameters.authorIds;
            specialties = event.multiValueQueryStringParameters.specialtyIds;
            pages = event.multiValueQueryStringParameters.page.length ? event.multiValueQueryStringParameters.page[0] : 0;
            pageSize = event.multiValueQueryStringParameters.pageSize.length ? event.multiValueQueryStringParameters.pageSize[0] : 0;

        } else if (event.queryStringParameters) {
            // Either multiQuery is no longer supported or was not provided, so validate the single query string params
            authors = [event.queryStringParameters.authorIds];
            specialties = [event.queryStringParameters.specialtyIds];
            pages = event.queryStringParameters.page;
            pageSize = event.queryStringParameters.pageSize;

        }
        else {
            throw new Error(`Invalid URI parameters were provided. Please ensure that you provide the following parameters: authorIds/specialtyIds, page, and pageSize.`)
        }

        /**
         * Read through files and join data
         */

        totalResults = pageSize * pages;

        // Return all the data since no filter was provided
        let totalAmount = 0;
        let lookforSpecificAuthor = authorIds && authorIds.length ? true : false;
        let lookforSpecificSpecialty = specialties && specialties.length ? true : false;

        for (const _auth in _authorFileData) {
            // Validate that we don't exceed the paged results
            if (totalAmount > totalResults) { break; }
            let authorObj = {};
            if (lookforSpecificAuthor) {
                if (!authordIds.includes(_auth.authorId)) {
                    // Does not include the current author, so skip this iteration
                    continue;
                }
            }

            authorObj.authorId = _auth.authorId;
            authorObj.name = _auth.name;

            let _specialtyArr = [];
            // Loop through all the specialties
            for (const _specialty in _auth.specialties) {
                for (const specialtyItem in _specialtyFileData) {
                    if (lookforSpecificSpecialty) {
                        if (!specialties.includes(specialtyItem)) {
                            // Haven't found the current specialties we are looking for, so skip
                            continue;
                        }
                    }
                    if (specialtyItem.specialtyId === _specialty) {
                        // Found a matching specialty
                        _specialtyArr.push(specialtyItem.specialty)
                    }
                }
            }
            authorObj.specialties = _specialtyArr;

            let _recipeArr = [];
            // Loop through and find all the recipes
            for (const _recipeItem of _recipeFileData) {
                if (_auth.authorId === _recipeItem.authorId) {
                    _recipeItem.push(_recipeItem);
                }
            }
            authorObj.recipes = _recipeArr;
            returnItems.push(authorObj)
            totalAmount++;
        }

        body = {
            data: returnItems,
            errors: []
        }
    }
    catch (error) {
        // Error occured, so log it and properly validate the right return object
        console.log(`Event: ${event}\n\nError: ${error}`)
        body = {
            data: [],
            errors: error
        }
    }
    finally {
        return {
            statusCode: 200,
            body: JSON.stringify(body),
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        }
    }
}