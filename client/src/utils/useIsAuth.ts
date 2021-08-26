import router from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {
  const [{ data, fetching }] = useMeQuery();
  useEffect(() => {
    // If the user isn't logged in when visiting this page...
    if (!fetching && !data?.me) {
      // ...send them to the login page before they do anything.
      router.replace(`/login?next=${ router.route }`);
    }
  }, [data, router, fetching]);
};