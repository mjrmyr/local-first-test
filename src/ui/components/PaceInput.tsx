import { formatSecondsToMmSs, normalizePaceInput, parseMmSsToSeconds } from '@/helpers/pace';
import { Input } from './Input';

type PaceInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
    value: string;
    onChange: (value: string) => void;
};

export function PaceInput({ value, onChange, ...props }: PaceInputProps) {
    return (
        <Input
            {...props}
            value={value}
            inputMode="numeric"
            onChange={(e) => onChange(normalizePaceInput(e.target.value))}
            onBlur={() => {
                const seconds = parseMmSsToSeconds(value);
                if (seconds !== undefined) {
                    onChange(formatSecondsToMmSs(seconds));
                }
            }}
        />
    );
}
