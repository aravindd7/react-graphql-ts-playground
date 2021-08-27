import { Exchange } from "@urql/core";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { dedupExchange, fetchExchange, stringifyVariables } from "urql";
import { pipe, tap } from "wonka";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        // If the OperationResult has an error, send a request to sentry
        if (error) {
          // do something here.
        }
      })
    );
  };

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    console.log("==================== START ====================")
    const { parentKey: entityKey, fieldName } = info;
    
    // Gets the fields from the cache including a fieldKey and fieldName. This
    // will be an array with objects containing a fieldKey, fieldName, and
    // arguments. Use console.log to see what this looks like.
    // NOTE: This will be ALL the fields in the cache under the entityKey. 
    //       This could be mutations or queries depending on what was called.
    const allFields = cache.inspectFields(entityKey);
    // Once allFields grabs all the posts under entityKey (e.g. all queries), 
    // fieldInfos will filter through these to find all the entities that
    // match the fieldName (e.g. posts or users). If all the queries in the
    // cache are posts, and we're looking for post queries, the fieldInfos
    // array will look exactly like the allFields array. In production,
    // however, the cache probably won't look like that.
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;

    if (size === 0) {
      return undefined;
    }
    
    console.log("entityKey: ", entityKey);
    console.log("fieldName: ", fieldName);
    console.log("allFields: ", allFields);
    console.log("fieldInfos: ", fieldInfos);

    const results: string[] = [];

    const fieldKey = `${ fieldName }(${ stringifyVariables(fieldArgs) })`;
    const isThereDataInTheCache = cache.resolve(entityKey, fieldKey) as boolean;
    info.partial = !isThereDataInTheCache;

    console.log("fieldKey: ", fieldKey);
    console.log("cacheCheck: ", !isThereDataInTheCache);

    fieldInfos.forEach(fi => {
      // For each query or mutation that fieldInfos has in its array, we're
      // going to resolve them from the server. This looks to be a string[]
      // of resolved graphql operations (e.g. queries or mutations). That is
      // to say, we're finding an array of data from the cache and not the
      // server. THE SERVER IS NOT CALLED WHEN THESE ARE RESOLVED, THIS JUST
      // CHECKS WHAT IS IN THE CACHE.
      const data = cache.resolve(entityKey, fi.fieldKey) as string[];
      console.log(data);
      results.push(...data); // Array.push each element in data separately
    });

    console.log("====================  END  ====================");
    
    return results;
  }
};

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      resolvers: {
        Query: {
          posts: cursorPagination(),
        }
      },
      updates: {
        Mutation: {
          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              () => ({ me: null })
            );
          },
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user,
                  };
                }
              }
            );
          },
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  };
                }
              }
            );
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
});
