import React from "react";
import { Form, Formik } from "formik";
import { Box, Button } from "@chakra-ui/react";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { useMutation } from "urql";

interface registerProps {};

const REGISTER_MUTATION = `
  mutation($username: String!, $password: String!) {
    register(options: { username: $username, password: $password }) {
      errors {
        field
        message
      }
      user {
        id
        username
      }
    }
  }
`;

export const Register: React.FC<registerProps> = ({}) => {
  
  const [, register] = useMutation(REGISTER_MUTATION);

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{username: "", password: ""}}
        onSubmit={(values) => {
          return register(values);
        }}
      > 
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              placeholder="Username"
              label="Username"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="Password"
                label="Password"
                type="password"
              />
            </Box>
            <Button 
              type='submit' 
              colorScheme="teal" 
              mt={4} 
              isLoading={ isSubmitting }
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
