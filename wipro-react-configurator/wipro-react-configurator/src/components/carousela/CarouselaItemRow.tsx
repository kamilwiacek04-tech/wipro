import React from 'react'

interface Props {
    title: string;
    value: string;
    last?: boolean
}

const CarouselaItemRow = ({title, value, last=false}: Props) => {
  return (
    <div className={`carouselaItemRow ${last && 'carouselaItemRowLast'}`}>
        <p className='carouselaItemRowParagraph leftText'>{`${title}:`}</p>
        <p className='carouselaItemRowParagraph rightText'>{value}</p>
    </div>
  )
}

export default CarouselaItemRow