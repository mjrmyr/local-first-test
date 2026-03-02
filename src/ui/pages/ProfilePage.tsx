import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { athleteService } from '../../application/athleteService';
import type { Athlete } from '../../domain/models/athlete';
import type { Gender } from '../../domain/types';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Input } from '../components/Input';

type FieldErrors = {
    name?: string;
    birthday?: string;
    weight?: string;
    height?: string;
    gender?: string;
};

export function ProfilePage() {
    const navigate = useNavigate();
    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [name, setName] = useState('');
    const [gender, setGender] = useState<Gender | ''>('');
    const [birthday, setBirthday] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');

    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitError, setSubmitError] = useState('');
    const [saved, setSaved] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        athleteService.getActive().then((result) => {
            if (result.ok && result.data) {
                const a = result.data;
                setAthlete(a);
                setName(a.name);
                setGender(a.gender);
                setBirthday(a.birthday);
                setWeight(a.weight !== undefined ? String(a.weight) : '');
                setHeight(a.height !== undefined ? String(a.height) : '');
            } else {
                setLoadError('Failed to load profile');
            }
            setLoading(false);
        });
    }, []);

    function validate(): FieldErrors | null {
        const errs: FieldErrors = {};
        if (!name.trim()) errs.name = 'Name is required';
        if (!gender) errs.gender = 'Please select a gender';
        if (!birthday) errs.birthday = 'Birthday is required';
        const w = weight !== '' ? Number(weight) : undefined;
        const h = height !== '' ? Number(height) : undefined;
        if (w !== undefined && (isNaN(w) || w <= 0)) errs.weight = 'Weight must be a positive number';
        if (h !== undefined && (isNaN(h) || h <= 0)) errs.height = 'Height must be a positive number';
        return Object.keys(errs).length > 0 ? errs : null;
    }

    async function handleSave() {
        const errs = validate();
        if (errs) {
            setErrors(errs);
            return;
        }
        setErrors({});
        setSubmitting(true);
        setSubmitError('');
        setSaved(false);

        const w = weight !== '' ? Number(weight) : undefined;
        const h = height !== '' ? Number(height) : undefined;

        const result = await athleteService.update({
            name: name.trim(),
            gender: gender as Gender,
            birthday,
            weight: w,
            height: h,
        });

        setSubmitting(false);

        if (result.ok) {
            setAthlete(result.data);
            setSaved(true);
        } else {
            setSubmitError(result.error);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fff4e1]">
                <span className="text-gray-400">Loading…</span>
            </div>
        );
    }

    if (loadError || !athlete) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fff4e1]">
                <p className="text-red-600">{loadError || 'Profile not found'}</p>
            </div>
        );
    }

    const genderOptions: { value: Gender; label: string }[] = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#fff4e1]">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-orange-100">
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-gray-900">Profile</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-sm mx-auto w-full">
                <FormField label="Name" error={errors.name}>
                    <Input
                        value={name}
                        onChange={(e) => { setName(e.target.value); setSaved(false); }}
                        placeholder="Your name"
                    />
                </FormField>

                <FormField label="Gender" error={errors.gender}>
                    <div className="flex flex-col gap-2">
                        {genderOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { setGender(opt.value); setSaved(false); }}
                                className={`rounded-xl border-2 px-4 py-3 text-left font-medium transition-colors ${
                                    gender === opt.value
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </FormField>

                <FormField label="Birthday" error={errors.birthday}>
                    <Input
                        type="date"
                        value={birthday}
                        onChange={(e) => { setBirthday(e.target.value); setSaved(false); }}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </FormField>

                <FormField label="Weight (kg)" error={errors.weight}>
                    <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={weight}
                        onChange={(e) => { setWeight(e.target.value); setSaved(false); }}
                        placeholder="e.g. 70"
                    />
                </FormField>

                <FormField label="Height (cm)" error={errors.height}>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={height}
                        onChange={(e) => { setHeight(e.target.value); setSaved(false); }}
                        placeholder="e.g. 175"
                    />
                </FormField>

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                {saved && <p className="text-sm text-green-600">Profile saved.</p>}

                <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                </Button>
            </main>
        </div>
    );
}
