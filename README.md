# NgxGrandValidator

Validation library for Angular

## Example

```
export class FormModel extends GrandValidatonFormModel {
  @GrandValidation.maxLength(120)
  @GrandValidation.minLength(5)
  @GrandValidation.string()
  firstName!: string;

  @GrandValidation.maxLength(120)
  @GrandValidation.lastName(5)
  @GrandValidation.string()
  firstName!: string;

  @GrandValidation.required()
  @GrandValidation.email()
  email: number;
}

```

```
 const form = FormModel.createUIForm();
 form.validate();
```
