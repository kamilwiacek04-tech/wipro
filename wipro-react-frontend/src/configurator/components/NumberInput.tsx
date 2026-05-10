import { Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFormStore } from '@/store/zustand/formStore';

interface Props {
    title: string;
    currentValue: number;
    range: {
        min: number;
        max: number;
        dependOn?: {
            path: string;
            field: string;
        },
        dependsOn?: {
            main: {
                path: string;
                field: string;
            }
            second: {
                path: string;
                field: string;
            }
        }
    },
    onChange: (e: number) => void;
    error?: string;
}

const NumberInput = ({title, currentValue, range, onChange, error}: Props) => {
    const {t} = useTranslation();

    const handleSliderChange = (_event: Event, newValue: number) => {
        onChange(newValue)
    };

    const formState = useFormStore.getState().store

    let errorMassage = '';
    if(error) {
        if(error.includes('|')) {
            const [key, value] = error.split('|');
            errorMassage = t(key, {number: value})
        } else {
            errorMassage = t(error)
        }
    }

    const store = formState as unknown as Record<string, Record<string, number>>;
    const maxValue = range.dependOn
        ? store[range.dependOn.path]?.[range.dependOn.field] * 2
        : range.dependsOn
        ? store[range.dependsOn.main.path]?.[range.dependsOn.main.field] - store[range.dependsOn.second.path]?.[range.dependsOn.second.field]
        : range.max;

  return (
    <div className="flex-1 -mt-5">
        <p className="text-[15px] font-semibold text-[var(--grey)]">{title}</p>
        <div className="flex gap-5 max-[1000px]:flex-col max-[1000px]:gap-0">
            <Slider
                min={range.min}
                max={maxValue}
                value={currentValue}
                onChange={handleSliderChange}
                valueLabelDisplay="auto"
                sx={{ color: "var(--primary)" }}
            />
            <input
                className="w-[50px] border border-[var(--primary)] text-center rounded-[5px]"
                type='number'
                min={range.min}
                max={maxValue}
                value={currentValue}
                onChange={(e) => onChange(parseInt(e.target.value))}
            />
        </div>
        <p className="text-[14px] mt-1 text-[var(--red)]">{errorMassage}</p>
    </div>
  )
}

export default NumberInput
