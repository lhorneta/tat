import React, { FC } from 'react'
import * as type from "./types"
import './styles/card.css';

type TourProps = {
    tour: type.Tour
}

export const TourCardDetail: FC<TourProps> = (item: TourProps ) => {
    const {
        amount,
        cityName,
        countryName,
        currency,
        countryFlag,
        img,
        name,
        startDate,
    } = item.tour
    return (
        <div className="card">
            <img src={img} alt="Avatar" className="avatar" />
            <div className="card-container">
                <h4 className="tour-title">{name}</h4>
                <p className='tour-country'>
                    <img src={countryFlag} alt='country flag' className="card-country-flag" />
                    {countryName}, {cityName}
                </p>
                <p className='tour-info'>Старт туру</p>
                <p className='tour-info'>{startDate.split('-').reverse().join('.')}</p>

                <p className='tour-price'>{amount} {currency}</p>
                <p><a className='tour-link' href="/#">Відкрити ціну</a></p>
            </div>
        </div>
    )
}
