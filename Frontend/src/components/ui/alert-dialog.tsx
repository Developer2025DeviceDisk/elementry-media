'use client';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Button } from './button';
export function ConfirmationDialog({
  title,
  description,
  onConfirm,
  disabled,
  children,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AlertDialogPrimitive.Root>
      <AlertDialogPrimitive.Trigger asChild>{children}</AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-6 shadow-xl">
          <AlertDialogPrimitive.Title className="text-xl font-semibold">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="my-4 text-muted-foreground">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="flex justify-end gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button variant="destructive" disabled={disabled} onClick={onConfirm}>
                Confirm
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
