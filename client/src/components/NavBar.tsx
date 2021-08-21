import React from "react";
import { Box } from "@chakra-ui/layout";
import { Button, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();
  let body = null;

  if (fetching) {
    // Data is loading
    body = null;
  } else if (!data?.me) {
    // User not logged in
    body = (
      <>
        <NextLink href="/login">
          <Link color="white" mr={2}>
            Login
          </Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white">Register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex>
        <Box mr={2} color="white">{ data.me.username }</Box>
        <Button variant="link" color="white">Logout</Button>
      </Flex>
    )
  }

  return (
    <Flex bg="green.600" p={4} ml={"auto"}>
      <Box ml={"auto"}>{ body }</Box>
    </Flex>
  );
};

export default NavBar;
