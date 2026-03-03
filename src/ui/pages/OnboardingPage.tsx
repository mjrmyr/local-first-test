import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { athleteService } from '../../application/athleteService';
import type { Gender } from '../../domain/types';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Input } from '../components/Input';

type Step = 'welcome' | 'name' | 'gender' | 'birthday';

interface OnboardingPageProps {
    onComplete: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('welcome');
    const [name, setName] = useState('');
    const [gender, setGender] = useState<Gender | ''>('');
    const [birthday, setBirthday] = useState('');
    const [nameError, setNameError] = useState('');
    const [genderError, setGenderError] = useState('');
    const [birthdayError, setBirthdayError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleNameNext() {
        if (!name.trim()) {
            setNameError('Name is required');
            return;
        }
        setNameError('');
        setStep('gender');
    }

    function handleGenderNext() {
        if (!gender) {
            setGenderError('Please select a gender');
            return;
        }
        setGenderError('');
        setStep('birthday');
    }

    async function handleSubmit() {
        if (!birthday) {
            setBirthdayError('Birthday is required');
            return;
        }
        setBirthdayError('');
        setSubmitting(true);
        setSubmitError('');

        const result = await athleteService.create({
            name: name.trim(),
            gender: gender as Gender,
            birthday,
        });

        setSubmitting(false);

        if (result.ok) {
            onComplete();
            navigate('/');
        } else {
            setSubmitError(result.error);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
            <div className="w-full max-w-sm">
                {step === 'welcome' && <WelcomeStep onNext={() => setStep('name')} />}

                {step === 'name' && (
                    <NameStep
                        value={name}
                        error={nameError}
                        onChange={setName}
                        onNext={handleNameNext}
                    />
                )}

                {step === 'gender' && (
                    <GenderStep
                        value={gender}
                        error={genderError}
                        onChange={setGender}
                        onNext={handleGenderNext}
                        onBack={() => setStep('name')}
                    />
                )}

                {step === 'birthday' && (
                    <BirthdayStep
                        value={birthday}
                        error={birthdayError || submitError}
                        onChange={setBirthday}
                        onSubmit={handleSubmit}
                        onBack={() => setStep('gender')}
                        submitting={submitting}
                    />
                )}
            </div>
        </div>
    );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
    return (
        <div className="flex flex-col items-center gap-8 text-center">
            <div>
                <h1 className="text-4xl font-bold text-foreground">kaeno</h1>
                <p className="mt-2 text-muted">Your personal training companion</p>
            </div>
            <p className="text-muted">
                Track your endurance training — all stored locally, completely private.
            </p>
            <Button onClick={onNext}>Get started</Button>
        </div>
    );
}

function NameStep({
    value,
    error,
    onChange,
    onNext,
}: {
    value: string;
    error: string;
    onChange: (v: string) => void;
    onNext: () => void;
}) {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-foreground">What's your name?</h2>
                <p className="mt-1 text-sm text-muted">Step 1 of 3</p>
            </div>
            <FormField label="Name" required error={error}>
                <Input
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onNext()}
                />
            </FormField>
            <Button onClick={onNext}>Continue</Button>
        </div>
    );
}

function GenderStep({
    value,
    error,
    onChange,
    onNext,
    onBack,
}: {
    value: Gender | '';
    error: string;
    onChange: (v: Gender) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const options: { value: Gender; label: string }[] = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-foreground">What's your gender?</h2>
                <p className="mt-1 text-sm text-muted">Step 2 of 3</p>
            </div>
            <div className="flex flex-col gap-3">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-left font-medium transition-colors ${
                            value === opt.value
                                ? 'border-primary bg-primary/10 text-primary-dark'
                                : 'border-navy/10 bg-surface text-foreground hover:border-navy/15'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
                {error && <p className="text-sm text-error">{error}</p>}
            </div>
            <div className="flex flex-col gap-2">
                <Button onClick={onNext}>Continue</Button>
                <Button variant="secondary" onClick={onBack}>
                    Back
                </Button>
            </div>
        </div>
    );
}

function BirthdayStep({
    value,
    error,
    onChange,
    onSubmit,
    onBack,
    submitting,
}: {
    value: string;
    error: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onBack: () => void;
    submitting: boolean;
}) {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-foreground">When were you born?</h2>
                <p className="mt-1 text-sm text-muted">Step 3 of 3</p>
            </div>
            <FormField label="Birthday" required error={error}>
                <Input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                />
            </FormField>
            <div className="flex flex-col gap-2">
                <Button onClick={onSubmit} disabled={submitting}>
                    {submitting ? 'Saving…' : 'Start training'}
                </Button>
                <Button variant="secondary" onClick={onBack} disabled={submitting}>
                    Back
                </Button>
            </div>
        </div>
    );
}
