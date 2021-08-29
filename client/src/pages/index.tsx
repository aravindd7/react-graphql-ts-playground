import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index: React.FC<{}> = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });

  if (!fetching && !data) {
    return (
      <Layout>
        <div>no posts to find.</div>;
      </Layout>
    );
  }

  return (
    <Layout>
      {!data && fetching ? (
        <Box>loading...</Box>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
              <Flex
                flex="0 1 30px"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
              >
                <IconButton 
                  icon={<ChevronUpIcon w="1.5em" h="auto" />}
                  aria-label="upvote"
                  variant="link"
                />
                {p.points}
                <IconButton
                  icon={<ChevronDownIcon w="1.5em" h="auto" />}
                  aria-label="downvote"
                  variant="link"
                />
              </Flex>
              <Flex flexDirection="column" ml="4" flex="1 0 auto">
                <Flex
                  flex="1 0 auto"
                  justifyContent="space-between"
                  align-items="center"
                  width="100%"
                >
                  <Heading fontSize="xl">{p.title}</Heading> Posted by{" "}
                  {p.creator.username}
                </Flex>
                <Text mt={4} width="100%">
                  {p.textSnippet}
                </Text>
              </Flex>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMorePosts ? (
        <Flex>
          <Button
            m="auto"
            my={8}
            isLoading={fetching}
            onClick={() => {
              setVariables({
                limit: variables?.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
          >
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
