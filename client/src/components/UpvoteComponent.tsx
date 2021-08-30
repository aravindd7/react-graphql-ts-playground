import { IconButton } from "@chakra-ui/button";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex } from "@chakra-ui/layout";
import React from "react";
import { useVoteMutation } from "../generated/graphql";

interface UpvoteComponentProps {
  points: number;
  postId: number;
}

export const UpvoteComponent: React.FC<UpvoteComponentProps> = ({ points, postId }) => {
  const [, vote] = useVoteMutation();
  return (
    <Flex
      flex="0 1 30px"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      paddingRight="0.5rem"
    >
      <IconButton 
        icon={<ChevronUpIcon w="1.5em" h="auto" />}
        aria-label="upvote"
        variant="link"
        onClick={() => vote({ value: 1, postId })}
      />
      { points }
      <IconButton
        icon={<ChevronDownIcon w="1.5em" h="auto" />}
          aria-label="downvote"
          variant="link"
          onClick={() => vote({ value: -1, postId })}
        />
    </Flex>
  );
}

export default UpvoteComponent;