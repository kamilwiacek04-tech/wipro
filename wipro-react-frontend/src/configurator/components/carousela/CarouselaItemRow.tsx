interface Props {
    title: string;
    value: string;
    last?: boolean
}

const CarouselaItemRow = ({title, value}: Props) => {
  return (
    <div className="flex justify-between items-center py-1 px-3 border-b border-[#f5f5f5] last:border-b-0">
        <p className="text-[11px] text-[var(--grey)]">{`${title}:`}</p>
        <p className="text-[12px] font-semibold text-[var(--secondary)]">{value}</p>
    </div>
  )
}

export default CarouselaItemRow
