// ============================================================
// VISION ERP - Quick register dialog
// modules/patients/quick-register-dialog.tsx
// ============================================================

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QuickRegisterFormSchema,
  type QuickRegisterFormValues,
  toQuickRegisterPayload,
  SEX_OPTIONS,
} from "./patient.schema";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuickRegister } from "@/hooks/use-patients";

interface QuickRegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (patientId: string) => void;
}

export function QuickRegisterDialog({ open, onClose, onCreated }: QuickRegisterDialogProps) {
  const mutation = useQuickRegister();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickRegisterFormValues>({
    resolver: zodResolver(QuickRegisterFormSchema),
    defaultValues: {
      forename: "",
      surname: "",
      dob: "",
      sex: "MALE",
      mobile: "",
      email: "",
      postcode: "",
    },
  });

  function close() {
    reset();
    onClose();
  }

  async function onSubmit(values: QuickRegisterFormValues) {
    const patient = await mutation.mutateAsync(toQuickRegisterPayload(values));
    onCreated?.(patient.id);
    close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Quick Register"
      description="Capture the essentials now — complete the full record later."
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            form="quick-register-form"
            type="submit"
            isLoading={mutation.isPending}
          >
            Register
          </Button>
        </>
      }
    >
      <form id="quick-register-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="qr-forename">Forename *</Label>
            <Input id="qr-forename" hasError={!!errors.forename} {...register("forename")} />
            <FieldError message={errors.forename?.message} />
          </div>
          <div>
            <Label htmlFor="qr-surname">Surname *</Label>
            <Input id="qr-surname" hasError={!!errors.surname} {...register("surname")} />
            <FieldError message={errors.surname?.message} />
          </div>
          <div>
            <Label htmlFor="qr-dob">Date of Birth *</Label>
            <Input id="qr-dob" type="date" hasError={!!errors.dob} {...register("dob")} />
            <FieldError message={errors.dob?.message} />
          </div>
          <div>
            <Label htmlFor="qr-sex">Sex *</Label>
            <Select id="qr-sex" options={SEX_OPTIONS} hasError={!!errors.sex} {...register("sex")} />
            <FieldError message={errors.sex?.message} />
          </div>
          <div>
            <Label htmlFor="qr-mobile">Mobile</Label>
            <Input id="qr-mobile" {...register("mobile")} />
          </div>
          <div>
            <Label htmlFor="qr-postcode">Postcode *</Label>
            <Input id="qr-postcode" hasError={!!errors.postcode} {...register("postcode")} />
            <FieldError message={errors.postcode?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="qr-email">Email</Label>
            <Input id="qr-email" type="email" hasError={!!errors.email} {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
      </form>
    </Modal>
  );
}