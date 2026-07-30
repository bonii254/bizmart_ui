export const handleBackendErrors = (
  error: any, 
  setErrors: (errors: any) => void,
  setGlobalError: (msg: string | null) => void
) => {
  setGlobalError(null);
  const responseData = error?.response?.data;
  const errorData = responseData?.errors || responseData || error;

  if (typeof errorData === 'object' && errorData !== null) {
    const flattenedErrors: Record<string, string> = {};
    
    Object.keys(errorData).forEach((key) => {
      const val = errorData[key];
      
      const message = (Array.isArray(val) ? val : String(val)) as string;

      if (key === 'error' || key === 'details' || key === 'message' || key === 'type' || key === '_schema') {
        setGlobalError(message);
      } else {
        flattenedErrors[key] = message;
      }
    });

    setErrors(flattenedErrors);
  } else if (typeof errorData === 'string') {
    setGlobalError(errorData);
  }
};