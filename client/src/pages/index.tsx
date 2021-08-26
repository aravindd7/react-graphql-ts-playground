import { Box } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React from "react";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [{ data }] = usePostsQuery({ variables: { limit: 10 } });
  return (
    <Layout>
      {!data ? (
        <Box>loading...</Box>
      ) : (
        data.posts.map((p) => (
          <Box key={p.id}>
            {Intl.DateTimeFormat("en-US").format(parseInt(p.createdAt))}{" "}
            {p.title}
          </Box>
        ))
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
