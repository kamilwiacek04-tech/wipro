interface Props {
    title: string;
    value: string;
}

const SummaryRow = ({title, value}: Props) => {
  return (
    <div className="w-full border border-[var(--primary)] rounded-[4px] relative py-0.5">
        <p className="m-0 text-[var(--grey)] text-[13px] font-semibold absolute -top-2 left-[10px] bg-white">{title}</p>
        <p className="text-right my-[7px] mx-[5px] break-all">{value}</p>
    </div>
  )
}

export default SummaryRow
