// @ts-nocheck

import { FormControl } from '@angular/forms';

import { expect } from 'chai';
import { requiredValidator } from './required.validator';

describe('required', () => {
	let control: FormControl;

	beforeEach(() => {
		control = new FormControl(null, requiredValidator());
	});

	it('should return true if the value is present and contains any nonspacing symbols', () => {
		control.patchValue('some value');
		expect(control.valid).to.be.true;

		control.patchValue(0);
		expect(control.valid).to.be.true;
	});

	it('should return false for invalid values', () => {
		control = new FormControl(null, requiredValidator());
		control.patchValue('');
		expect(control.valid).to.be.false;

		control = new FormControl(null, requiredValidator());
		control.patchValue(null);
		expect(control.valid).to.be.false;
	});
});
