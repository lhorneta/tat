import * as type from "./types"
import pathToHotelIcon from './../../assets/bed.jpg';
import pathToCityIcon from './../../assets/city.jpg';

export const getDropdownIcon = (option: type.GeoEntity) => {
    let iconPath: string = ''
    switch (option.type) {
        case 'city': iconPath = pathToCityIcon; break;
        case 'hotel': iconPath = pathToHotelIcon; break;
        case 'country': iconPath = option.flag; break;
        default:
            // @ts-ignore
            iconPath = option?.flag;
            break;
    }
    return iconPath
}

export const getCountryIDFromInputValue = (inputValue: string, countries: type.Country[], hotels: type.Hotel[]) => {

    let
        tt1 = Object.values(countries).filter((item): type.Country | boolean => item?.name.includes(inputValue)),
        tt2 = Object.values(hotels).filter((item): type.Hotel | boolean => item?.name.includes(inputValue)),
        tt3 = Object.values(hotels).filter((item): type.Hotel | boolean => item?.countryName.includes(inputValue)),
        tt4 = Object.values(hotels).filter((item): type.Hotel | boolean => item?.cityName.includes(inputValue))

    return (tt1.length && tt1[0]?.id) || (tt2.length && tt2[0]?.countryId) || (tt3.length && tt3[0]?.countryId) || (tt4.length && tt4[0]?.countryId)
}

export const getFlagIconByCountryId = (countryList: type.Country[], countryID: string) =>
    Object.values(countryList).filter((item): type.Country | boolean => item?.id === countryID)[0].flag

export const prepareAndAggregateDataToRenderHotels = (tours: type.Tour[], hotels: type.Hotel[], countryList: type.Country[]) => {

    let toursList = Object.values(tours)
    let hotelsList = Object.values(hotels)
    let preparedHotelList: type.Tour[] = [];

    for (const [key, value] of Object.entries(toursList[0])) {
        const filterHotelList = Object.fromEntries(
            Object.entries(hotelsList).filter(
                ([, hotel]) => {
                    // @ts-ignore
                    if (Number(hotel.id) === Number(value?.hotelID)) {
                        const countryFlagIcon = getFlagIconByCountryId(countryList, hotel?.countryId)
                        // @ts-ignore 
                        preparedHotelList.push({ ...value, ...hotel, countryFlag: countryFlagIcon })
                    }
                }
            )
        )
    }

    const sortedByPriceAscending = preparedHotelList.sort((a: type.Tour, b: type.Tour) => (a.amount > b.amount) ? 1 : ((b.amount > a.amount) ? -1 : 0))
    return sortedByPriceAscending
}