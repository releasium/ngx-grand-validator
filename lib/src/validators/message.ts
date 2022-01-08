export interface GrandValidatorMessage {
  validator: string;
  text: string | undefined;
  asyncValidator?: string;
}
