declare module 'react-native/Libraries/Types/CodegenTypes' {
  export type DirectEventHandler<T> = (event: { nativeEvent: T }) => void;
  export type BubblingEventHandler<T> = (event: { nativeEvent: T }) => void;
}
