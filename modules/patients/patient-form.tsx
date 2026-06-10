// ============================================================
// VISION ERP - Patient create/edit form
// modules/patients/patient-form.tsx
// ------------------------------------------------------------
// Shared by /patients/new and /patients/[id]/edit. Maps 422
// field errors from the API back onto the relevant inputs.
// ============================================================

"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PatientFormSchema,
  type PatientFormValues,
  TITLE_OPTIONS,
  SEX_OPTIONS,
  CONTACT_PREF_OPTIONS,
} from "./patient.schema";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PatientFormProps {
  defaultValues?: Partial<PatientFormValues>;
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
}

const EMPTY: PatientFormValues = {
  title: "MR",
  forename: "",
  initial: "",
  surname: "",
  dob: "",
  sex: "MALE",
  address1: "",
  address2: "",
  town: "",
  county: "",
  postcode: "",
  homePhone: "",
  workPhone: "",
  mobile: "",
  email: "",
  occupation: "",
  nhsNumber: "",
  gpName: "",
  gpAddress: "",
  isKeyPatient: false,
  isStaffRelative: false,
  isMemberOfStaff: false,
  marketingOptIn: true,
  contactPref: [],
  notes: "",
  previousEyeTest: "",
};

export function PatientForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Personal details */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Select id="title" options={TITLE_OPTIONS} {...register("title")} />
          </div>
          <div>
            <Label htmlFor="forename">Forename *</Label>
            <Input id="forename" hasError={!!errors.forename} {...register("forename")} />
            <FieldError message={errors.forename?.message} />
          </div>
          <div>
            <Label htmlFor="surname">Surname *</Label>
            <Input id="surname" hasError={!!errors.surname} {...register("surname")} />
            <FieldError message={errors.surname?.message} />
          </div>
          <div>
            <Label htmlFor="initial">Initial</Label>
            <Input id="initial" maxLength={5} {...register("initial")} />
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input id="dob" type="date" hasError={!!errors.dob} {...register("dob")} />
            <FieldError message={errors.dob?.message} />
          </div>
          <div>
            <Label htmlFor="sex">Sex *</Label>
            <Select id="sex" options={SEX_OPTIONS} hasError={!!errors.sex} {...register("sex")} />
            <FieldError message={errors.sex?.message} />
          </div>
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" {...register("occupation")} />
          </div>
          <div>
            <Label htmlFor="previousEyeTest">Previous Eye Test</Label>
            <Input id="previousEyeTest" type="date" {...register("previousEyeTest")} />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="address1">Address Line 1 *</Label>
            <Input id="address1" hasError={!!errors.address1} {...register("address1")} />
            <FieldError message={errors.address1?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input id="address2" {...register("address2")} />
          </div>
          <div>
            <Label htmlFor="town">Town / City *</Label>
            <Input id="town" hasError={!!errors.town} {...register("town")} />
            <FieldError message={errors.town?.message} />
          </div>
          <div>
            <Label htmlFor="county">County</Label>
            <Input id="county" {...register("county")} />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode *</Label>
            <Input id="postcode" hasError={!!errors.postcode} {...register("postcode")} />
            <FieldError message={errors.postcode?.message} />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" {...register("mobile")} />
          </div>
          <div>
            <Label htmlFor="homePhone">Home Phone</Label>
            <Input id="homePhone" {...register("homePhone")} />
          </div>
          <div>
            <Label htmlFor="workPhone">Work Phone</Label>
            <Input id="workPhone" {...register("workPhone")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" hasError={!!errors.email} {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="nhsNumber">NHS Number</Label>
            <Input id="nhsNumber" {...register("nhsNumber")} />
          </div>
          <div className="sm:col-span-3">
            <Label>Contact Preferences</Label>
            <Controller
              control={control}
              name="contactPref"
              render={({ field }) => (
                <div className="flex flex-wrap gap-4 pt-1">
                  {CONTACT_PREF_OPTIONS.map((opt) => {
                    const checked = field.value?.includes(opt.value as never) ?? false;
                    return (
                      <Checkbox
                        key={opt.value}
                        id={`pref-${opt.value}`}
                        label={opt.label}
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(field.value ?? []);
                          if (e.target.checked) next.add(opt.value as never);
                          else next.delete(opt.value as never);
                          field.onChange(Array.from(next));
                        }}
                      />
                    );
                  })}
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* GP + flags + notes */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical & Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gpName">GP Name</Label>
              <Input id="gpName" {...register("gpName")} />
            </div>
            <div>
              <Label htmlFor="gpAddress">GP Address</Label>
              <Input id="gpAddress" {...register("gpAddress")} />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <Checkbox id="isKeyPatient" label="Key patient" {...register("isKeyPatient")} />
            <Checkbox id="isStaffRelative" label="Staff relative" {...register("isStaffRelative")} />
            <Checkbox id="isMemberOfStaff" label="Member of staff" {...register("isMemberOfStaff")} />
            <Checkbox id="marketingOptIn" label="Marketing opt-in" {...register("marketingOptIn")} />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
            <FieldError message={errors.notes?.message} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}