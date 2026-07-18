export type FunctionTool = {
  /**
   * The name of the function to call.
   */
  name: string;

  /**
   * A JSON schema object describing the parameters of the function.
   */
  parameters: { [key: string]: unknown } | null;

  /**
   * The type of the function tool. Always `function`.
   */
  type: 'function';

  /**
   * Whether this function is deferred and loaded via tool search.
   */
  defer_loading?: boolean;

  /**
   * A description of the function. Used by the model to determine whether or not to
   * call the function.
   */
  description?: string;
}

export type AiResponse = 
  {
    type: "function_result",
    name: string,
    call_id: string,
    result: string
  } | 
  {
    type: "user_input",
    content: {
      text: string;
      type: "text";
    }[]
  }
  |
  {
    type: "model_output",
    content: {
      text: string;
      type: "text";
    }[]
  }
