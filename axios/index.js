const axios = require('axios');
const gql = require('graphql-tag');
const graphql = require('graphql');
const { print } = graphql;

let myQuery = gql`query {
    listAuthors(filter: {authorIds: {in: [$1]}, specialtyIds: {in: {$2}}}, page: $3, pageSize: $4) {
        items(first: $4, offset: $5) {
            userId
            name
            specialties {
                specialtyId
                specialty
            }
            recipies {
                recipeId
                authorId
                title
                ingredients
                prepTime
                cookTime
            }
        }
    }
}`

exports.handler = async (event) => {
    // Configure variables for later use
    let authors = null;
    let specialties = null;
    let pages = 0;
    let pageSize = 0;
    let body = {}

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

        // Replace and build query now with the right values
        if (authors)
            // Replace the first token
            myQuery.replace('$1', authors.length ? authors.join(',') : authors);

        if (specialties)
            myQuery.replace('$2', specialties.length ? specialties.join((',')) : specialties)

        if(myQuery.includes('$1') && myQuery.includes('$2')) {
            // Neither item was passed in, remove filter
            myQuery.replace('filter: null', '')
        }
        else if(myQuery.includes('$1')) {
            myQuery.replace('authorIds: {in: [$1]}, ','authorIds: null')
        }
        else if(myQuery.includes('$2')) {
            myQuery.replace(', specialtyIds: {in: {$2}}','specialtyIds: null')
        }

        // Replace page size if they exist
        // Otherwise fix query
        if(pages && pageSize) {
            myQuery.replace('$4', pageSize),
            myQuery.replace('$5', pageSize*pages);
        }
        else {
            myQuery.replace('page: $3', 'page: null').replace('pageSize: $4', 'pageSize: null').replace('items(first: $4, offset: $5)', 'items')
        }


        // Make request to API gateway and return the results
        const graphqlData = await axios({
            url: process.env.API_URL,
            method: 'post',
            headers: {
              'x-api-key': process.env.API_<TEST_API>_MYCUSTOMGRAPHQLAPI
            },
            data: {
              query: print(myQuery),
            }
          });
        
          body = {
              graphqlData: graphqlData.data.data.listAuthors
          }
    }
    catch (error) {
        // Error occured, so log it and properly validate the right return object
        console.log(`Event: ${event}\n\nError: ${error}`)
        body = {
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
};
