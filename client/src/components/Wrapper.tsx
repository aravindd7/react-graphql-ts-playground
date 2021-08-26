import { Box } from "@chakra-ui/layout";
import React from "react";

export type WrapperVariant = "small" | "regular";

interface WrapperProps {
  variant?: WrapperVariant;
}

export const Wrapper: React.FC<WrapperProps> = ({
  children,
  variant = "regular",
}) => {
  return (
    <Box
      maxWidth={variant === "regular" ? "800px" : "400px"}
      width="100%"
      mt={8}
      mx="auto"
    >
      {children}
    </Box>
  );
};
