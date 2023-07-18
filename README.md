# NgxGrandValidator

**@releasium/ngx-grand-validator** is a powerful and easy-to-use Angular library that simplifies the process of
implementing reactive form validation in your Angular applications. With **@releasium/ngx-grand-validator**, 
developers can create models, and effortlessly add decorators to the model's
fields for validation purposes. Say goodbye to writing extensive form validation logic by hand 
– let **ngx-grand-validator** handle it for you!


### Features:

- **Simple Integration:** Easily integrate **@releasium/ngx-grand-validator** into your Angular projects and get started with reactive form validation in no time.
- **Model-Based Validation:** Define your data models using TypeScript classes and decorate the fields with validation decorators to describe the validation rules.
- **Schema validation.** In case of complex form just create schema and work with reactive Forms
- **FormGroup Generation:** Utilize the defined models to automatically generate Angular `FormGroup` instances with all the specified validation rules applied.
- **Declaration** working with `FormGroup`, `FormArray`, `FormControl` as well
- **Built-in Validators**: Choose from a variety of built-in validation decorators, such as `@GV.required()`, `@GV.minLength()`, `@GV.maxLength()`, `@GV.pattern()`, and more.
- **Custom Validation**: Implement custom validation rules by creating your own validation decorators.
- **Error Messaging**: Receive detailed error messages based on the defined validation rules to provide precise feedback to users.
- **Consistency and Maintainability**: Centralize your validation logic within the models, making it easier to maintain and refactor in the future.


### How to start?
Install NgxGrandValidator using NPM:

``npm i @releasium/ngx-grand-validator --save``

### Example of using

```
// Your Model
export class UserModel extends GrandValidatonFormModel {
  @GV.maxLength(120)
  @GV.minLength(5)
  @GV.string()
  firstName!: string;

  @GV.maxLength(120)
  @GV.lastName(5)
  @GV.string()
  lastName!: string;

  @GV.required()
  @GV.email()
  email: number;
}

```

```
 //Your Component
 this.form = UserModel.createForm();
 form.validate();
```

```
 //Yout Template
  <form
    GV [gvModel]="UserModel"
    [formGroup]="form">
  <div>
    <input type="text" formControlName="firstName">
    <gv-error-message name="firstName"></gv-error-message>
  </div>
  <div>
    <input type="text" formControlName="lastName">
    <gv-error-message name="lastName"></gv-error-message>
  </div>
  ....
```

### Contributing:

We welcome contributions from the open-source community. If you have found a bug or have a feature request, please submit an issue or a pull request on our GitHub repository.

### License:

This library is distributed under the MIT License. Feel free to use it in your commercial and non-commercial projects.
