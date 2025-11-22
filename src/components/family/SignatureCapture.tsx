import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check } from 'lucide-react';

interface SignatureCaptureProps {
  onSignatureChange: (signatureData: string | null) => void;
  required?: boolean;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSignatureChange,
  required = false
}) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setIsEmpty(true);
    onSignatureChange(null);
  };

  const handleEnd = () => {
    if (sigPadRef.current) {
      const signature = sigPadRef.current.toDataURL('image/png');
      setIsEmpty(sigPadRef.current.isEmpty());
      onSignatureChange(signature);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Parent/Guardian Signature {required && <span className="text-destructive">*</span>}
      </label>

      <div className="border-2 border-border rounded-lg overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigPadRef}
          canvasProps={{
            className: 'w-full h-32 touch-action-none',
            style: { display: 'block' }
          }}
          backgroundColor="white"
          penColor="black"
          minWidth={0.5}
          maxWidth={2.5}
          onEnd={handleEnd}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isEmpty ? 'Sign above using your mouse or touchscreen' : 'Signature captured'}
        </p>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {!isEmpty && (
        <div className="flex items-center gap-1.5 text-xs text-accent">
          <Check className="w-3.5 h-3.5" />
          <span>Signature captured successfully</span>
        </div>
      )}
    </div>
  );
};
