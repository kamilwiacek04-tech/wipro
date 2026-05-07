import '@/assets/styles/components/SummaryRow.css'

interface Props {
    title: string;
    value: string;
}

const SummaryRow = ({title, value}: Props) => {
  return (
    <div className='summaryRowContainer'>
        <p className='summaryRowTitle'>{title}</p>
        <p className='summaryRowValue'>{value}</p>
    </div>
  )
}

export default SummaryRow