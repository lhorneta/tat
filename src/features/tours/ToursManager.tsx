import React, { useState, useEffect } from 'react'
import { TourCardDetail } from './TourCardDetail'
import { stopSearchPrices, getSearchPrices, getHotels, getHotel } from "../../mocks/api"
import * as type from "./types"
import { getDropdownIcon, prepareAndAggregateDataToRenderHotels, getCountryIDFromInputValue, getHotelIDList } from './utils'
import * as tourEndpoints from '../../app/services/tours';

import './styles/styles.css';
import './styles/combobox.css';

export const ToursManager = () => {
    const { data: countryList, error: errorCountryList, isPending: isPendingCountryList } = tourEndpoints.getListCountries();

    // state conditions
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isDisabled, setIsDisabled] = useState<boolean>(false);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [isCancelledSearch, setCancelledSearch] = useState<boolean>(false);

    // input & dropdown
    const [inputListOptions, setInputListOptions] = useState([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // data
    const [currentToken, setCurrentToken] = useState<string>('');
    const [countries, setCountries] = useState([]);
    const [tours, setTours] = useState<type.Tour[]>([]); // drafted tours
    const [hotels, setHotels] = useState<type.Hotel[]>([]); // drafted hotels
    const [hotelDescription, setHotelDescription] = useState<type.HotelDescription[]>([]); // drafted descriptions hotels
    const [preparedHotels, setPreparedHotels] = useState<type.Tour[]>([]); // final prepared data tours & hotels

    useEffect(() => {
        if (countryList) {
            setCountries(Object.values(countryList));
            setInputListOptions(Object.values(countryList));
        }
    }, [countryList]);

    useEffect(() => {
        if (Object.values(tours).length && Object.values(hotels).length && Object.values(hotelDescription).length) {
            const preparedHotelList: type.Tour[] = prepareAndAggregateDataToRenderHotels(tours, hotels, countryList, hotelDescription);
            preparedHotelList.length > 0 && setPreparedHotels(preparedHotelList);
        }
    }, [tours, hotels, hotelDescription]);

    const onSearchGeo = (search: type.GeoEntity) => {
        setLoading(true)
        if (search?.type && search?.type === 'country') {
            setInputListOptions(countries)
            return
        } else {
            tourEndpoints.getSearchGeo(search).then(data => {
                if (data) {
                    setLoading(false)
                    setInputListOptions(Object.values(data));
                } else {
                    setMessage('За вашим запитом турів не знайдено')
                }
            })
        }
    }

    const fetchWithRetry = async (token: string, maxRetries = tourEndpoints.MAX_RETRIES, delay: number, countryID: string): Promise<any> => {
        setLoading(true)
        try {
            await getSearchPrices(token).then((response) => {
                if (!response.ok) {
                    setErrorMessage(`HTTP error! status: ${response.status} ${response}`)
                }
                return response.json();
            }).then((tours) => {
                setTours(tours);
                getHotelListByCountryID(countryID)
                setCurrentToken(token)
            })
        } catch (error: unknown) {
            const specificError = error as Error
            setErrorMessage(`Fetch failed: ${specificError.message}. Retrying...`)
            if (maxRetries > 0) {
                await tourEndpoints.delay(delay)
                setErrorMessage(`Fetch failed: ${maxRetries} ${error}.`)
                return fetchWithRetry(token, maxRetries - 1, delay, countryID)
            } else {
                setLoading(false)
                setErrorMessage('Max retries reached. Failing request.')
            }
        }
    }

    const startSearchTours = (countryID: string | 0) => {
        if (!inputValue || !countryID) return
        setLoading(true)
        setErrorMessage('')
        tourEndpoints.startSearchHotelPrices(countryID).then((data: type.StartSearchResponse) => {
            if (data?.token) {
                const now: Date = new Date();
                // @ts-ignore
                const delay: number = new Date(data.waitUntil) - now;

                const timerId = setTimeout(() => {
                    fetchWithRetry(data.token, tourEndpoints.MAX_RETRIES, delay, countryID)
                }, delay);

                if (isCancelledSearch && timerId) {
                    clearTimeout(timerId)
                }
            }
        })
    }

    const getHotelByHotelID = async (hotels: type.Hotel[]) => {
        setLoading(true)
        setErrorMessage('')
        try {
            const hotelsDescription: type.HotelDescription[] = [];
            const hotelKeys = getHotelIDList(hotels)
            hotelKeys.map((hotelID: number) => {
                getHotel(hotelID).then((response) => {
                    if (!response.ok) {
                        setErrorMessage(`HTTP error! status: ${response.status} ${response}`)
                    }
                    setLoading(false)
                    return response.json();
                }).then((hotelDescription) => {
                    hotelsDescription.push(hotelDescription)
                    setHotelDescription(hotelsDescription)
                    setLoading(false)
                })
            })

        } catch (error: unknown) {
            const specificError = error as Error
            setErrorMessage(`Fetch failed: ${specificError.message}. Retrying...`)
            setLoading(false)
        }
    }

    const cache = new Map();
    const getHotelListByCountryID = async (countryID: string) => {
        setLoading(true)
        const cacheKey = JSON.stringify(countryID);
        try {
            if (cache.has(cacheKey)) {
                return cache.get(cacheKey);
            }
            const hotelsList = await getHotels(countryID).then((response) => {
                if (!response.ok) {
                    setErrorMessage(`HTTP error! status: ${response.status} ${response}`)
                }
                setLoading(false)
                return response.json();
            }).then((hotels) => {
                cache.set(cacheKey, hotels);
                setLoading(false)

                if (!Object.values(hotels).length) {
                    setMessage('За вашим запитом турів не знайдено')
                } else {
                    setHotels(hotels)
                    getHotelByHotelID(hotels)
                }
            })
        } catch (error: unknown) {
            const specificError = error as Error
            setLoading(false)
            setErrorMessage(`Fetch failed: ${specificError.message}.`)
        }
    }

    const isLaunchedNewSearch = (newValue: string) => (inputValue !== newValue) ? cancelSearch(currentToken) : setCancelledSearch(false)

    const cancelSearch = async (token: string) => {
        if (!token) return
        try {
            await stopSearchPrices(token).then((response) => {
                if (!response.ok) {
                    setErrorMessage(`HTTP error! status: ${response.status} ${response}`)
                }
                return response.json();
            }).then((data: type.StopSearchResponse) => {
                console.log('cancel::', data)
                setCancelledSearch(true)
                setTours([])
                setHotels([])
                setPreparedHotels([])
            })
        } catch (error: unknown) {
            const specificError = error as Error
            setErrorMessage(`Fetch failed: ${specificError.message}.`)
        }
    }

    const handleEnterKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            const target = event.target as HTMLInputElement;
            const countryID = getCountryIDFromInputValue(target.value, countries, hotels)
            setInputValue(target.value);
            startSearchTours(countryID)
            setIsOpen(false);
        }
    };

    const handleSubmitForm = () => {
        const countryID = getCountryIDFromInputValue(inputValue, countries, hotels)
        startSearchTours(countryID)
        setIsOpen(false);
        setIsDisabled(true)
        setMessage('')
        setErrorMessage('')
    }

    const handleDropdownItem = (option: type.Tour) => {
        onSearchGeo(option)
        startSearchTours(option.type === 'country' ? option.id : option.countryId)
        setInputValue(option.name);
        isLaunchedNewSearch(option.name)
        setIsOpen(false);
        setMessage('')
        setErrorMessage('')
    }

    const handleFocusInput = () => {
        setIsOpen(true);
        setIsDisabled(false);
        setMessage('');
        setErrorMessage('')
    }

    const handleChangeInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        // @ts-ignore
        onSearchGeo(e.target.value)
        setIsDisabled(false)
        setInputValue(e.target.value);
        setIsOpen(true); // Open list when typing
        setLoading(true)
    }

    return (
        <>
            <div className="container">
                <div className="tour-title">Форма пошуку турів</div>
                <div className="combobox-container">
                    <input
                        name="tour"
                        type="text"
                        value={inputValue}
                        onChange={handleChangeInput}
                        onFocus={handleFocusInput}
                        onKeyDown={handleEnterKeyDown}
                        className="combobox-input"
                        placeholder="Виберіть або введіть..."
                    />
                    {isOpen && (
                        <ul className="combobox-options-list">
                            {inputListOptions.map((option: type.Tour) => (
                                <li
                                    key={option.id}
                                    onClick={() => handleDropdownItem(option)}
                                    className="combobox-option-item"
                                >
                                    <img src={getDropdownIcon(option)} alt={option?.name} className="avatar-dropdown" /> {option?.name}
                                </li>
                            ))}
                        </ul>
                    )}
                    <button className="custom-primary-btn" disabled={isDisabled} onClick={handleSubmitForm}>
                        Знайти
                    </button>
                </div>
            </div>
            {(isLoading || isPendingCountryList) && <div className="tour-title-loading">
                <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>Завантажується....</div>}
            {(errorCountryList || errorMessage) &&
                <div className="tour-error-handler">{errorCountryList?.message || errorMessage}</div>}
            {(message) && <div className="tour-inform-handler">{message}</div>}
            <div className="card-holder">
                {
                    Object.entries(preparedHotels) &&
                    preparedHotels.map((item: type.Tour) => <TourCardDetail key={item.id} tour={item} />)
                }
            </div>
        </>
    );
}
