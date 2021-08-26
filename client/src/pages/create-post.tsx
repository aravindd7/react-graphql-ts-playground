import { Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import { Layout } from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useIsAuth } from "../utils/useIsAuth";

interface CreatePostProps {}

const CreatePost: React.FC<CreatePostProps> = ({}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, createPost] = useCreatePostMutation();
  useIsAuth();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await createPost({ input: values });

          if (response.error) {
            setErrors({
              title: "",
              text: "Please log in to create a post.",
            });
          }

          setIsSubmitting(true);
          // After submit, go to the post using router.
          router.push("/");
        }}
      >
        <Form>
          <InputField
            name="title"
            label="Title"
            placeholder="What do you want to post about today?"
          />
          <InputField name="text" label="Text" placeholder="" textarea />
          <Flex mt={4}>
            <Button type="submit" colorScheme="teal" isLoading={isSubmitting}>
              Submit post
            </Button>
          </Flex>
        </Form>
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
