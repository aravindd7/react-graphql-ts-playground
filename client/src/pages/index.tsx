import React from "react";
import { Box } from "@chakra-ui/react";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { withUrqlClient } from "next-urql";

import NavBar from "../components/NavBar";

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <>
      <NavBar />
      {!data ? (<Box>loading...</Box>) : data.posts.map((p) => <Box key={p.id}>{p.title}</Box>)}
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
