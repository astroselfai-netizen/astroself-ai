# Error Handling for Plan Access Errors

## Problem
The app was receiving 400 errors with the message:
```json
{
    "detail": "Plan 'cosmic_foundation' does not allow access to level 3"
}
```

## Solution
Updated all AI response functions in `user.service.ts` to properly handle plan access errors:

### Functions Updated:
1. `getGenerateHeadingAiResponse()`
2. `getDashaAiResponse()`
3. `getAntardashaAiResponse()`

### Error Handling Logic:
```typescript
} else if (error.response?.status === 400) {
  // Handle plan access errors specifically
  const errorDetail = error.response?.data?.detail;
  if (errorDetail && errorDetail.includes('does not allow access to level')) {
    const planMatch = errorDetail.match(/Plan '([^']+)' does not allow access to level (\d+)/);
    if (planMatch) {
      const [, planName, level] = planMatch;
      throw new Error(`Your current plan (${planName}) does not have access to level ${level} content. Please upgrade your plan to access this feature.`);
    }
  }
  // Handle other 400 errors
  throw new Error(errorDetail || 'Invalid request parameters. Please check your input and try again.');
}
```

### User Experience:
- **Before**: Generic "Invalid request parameters" error
- **After**: Clear message: "Your current plan (cosmic_foundation) does not have access to level 3 content. Please upgrade your plan to access this feature."

### Error Logging:
Added detailed error logging for better debugging:
```typescript
console.error('Get AI response error in service:', error);
console.log('Error response data:', error.response?.data);
```

## Testing
The error handling is automatically applied to all AI response calls in the ChatWithPrompts component, which will display the user-friendly error message to users.
