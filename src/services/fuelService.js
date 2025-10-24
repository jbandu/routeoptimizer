import { supabase } from '../lib/supabase';

export async function getFuelPriceComparison(originIata, destinationIata) {
  try {
    const { data: originPrice } = await supabase
      .rpc('get_latest_fuel_price', { airport_code: originIata })
      .single();

    const { data: destPrice } = await supabase
      .rpc('get_latest_fuel_price', { airport_code: destinationIata })
      .single();

    if (!originPrice || !destPrice) {
      return null;
    }

    const priceDifference = destPrice.price_per_gallon - originPrice.price_per_gallon;
    const percentageDifference = ((priceDifference / originPrice.price_per_gallon) * 100).toFixed(1);

    return {
      origin: {
        airport: originIata,
        pricePerGallon: parseFloat(originPrice.price_per_gallon),
        pricePerLiter: parseFloat(originPrice.price_per_liter),
        supplier: originPrice.supplier,
        effectiveDate: originPrice.effective_date
      },
      destination: {
        airport: destinationIata,
        pricePerGallon: parseFloat(destPrice.price_per_gallon),
        pricePerLiter: parseFloat(destPrice.price_per_liter),
        supplier: destPrice.supplier,
        effectiveDate: destPrice.effective_date
      },
      difference: {
        perGallon: parseFloat(priceDifference.toFixed(2)),
        percentage: parseFloat(percentageDifference)
      }
    };
  } catch (error) {
    console.error('Error fetching fuel prices:', error);
    return null;
  }
}

export async function calculateTankering(originIata, destinationIata, aircraftType, distanceNm) {
  try {
    const fuelComparison = await getFuelPriceComparison(originIata, destinationIata);
    if (!fuelComparison) {
      return null;
    }

    const { data: aircraft } = await supabase
      .from('aircraft_types')
      .select('*')
      .eq('iata_code', aircraftType)
      .single();

    if (!aircraft) {
      return null;
    }

    const tripFuelGallons = distanceNm * aircraft.fuel_burn_per_nm;
    const reserveFuelGallons = tripFuelGallons * 0.10;
    const requiredFuelGallons = tripFuelGallons + reserveFuelGallons;
    const maxTankerCapacityGallons = aircraft.max_fuel_capacity_gallons - requiredFuelGallons;

    if (maxTankerCapacityGallons <= 0) {
      return {
        recommended: false,
        reason: 'Insufficient fuel capacity for tankering',
        savings: 0
      };
    }

    const fuelPriceDiff = fuelComparison.origin.pricePerGallon - fuelComparison.destination.pricePerGallon;

    if (fuelPriceDiff <= 0.05) {
      return {
        recommended: false,
        reason: 'Price difference too small (< $0.05/gal)',
        savings: 0,
        fuelComparison
      };
    }

    const fuelWeightPerGallon = 6.7;
    let optimalTankerGallons = 0;
    let maxNetSavings = 0;

    for (let tankerGallons = 100; tankerGallons <= maxTankerCapacityGallons; tankerGallons += 100) {
      const extraWeightLbs = tankerGallons * fuelWeightPerGallon;
      const weightPenaltyFactor = (extraWeightLbs / (aircraft.operating_empty_weight_lbs + requiredFuelGallons * fuelWeightPerGallon)) * 0.01;
      const extraBurnGallons = tripFuelGallons * weightPenaltyFactor;

      const grossSavings = tankerGallons * fuelPriceDiff;
      const penaltyCost = extraBurnGallons * fuelComparison.origin.pricePerGallon;
      const netSavings = grossSavings - penaltyCost;

      if (netSavings > maxNetSavings && netSavings >= 50) {
        maxNetSavings = netSavings;
        optimalTankerGallons = tankerGallons;
      }
    }

    if (maxNetSavings < 50) {
      return {
        recommended: false,
        reason: 'Net savings below minimum threshold ($50)',
        savings: maxNetSavings,
        fuelComparison
      };
    }

    const extraWeightLbs = optimalTankerGallons * fuelWeightPerGallon;
    const weightPenaltyFactor = (extraWeightLbs / (aircraft.operating_empty_weight_lbs + requiredFuelGallons * fuelWeightPerGallon)) * 0.01;
    const extraBurnGallons = tripFuelGallons * weightPenaltyFactor;
    const grossSavings = optimalTankerGallons * fuelPriceDiff;
    const penaltyCost = extraBurnGallons * fuelComparison.origin.pricePerGallon;

    return {
      recommended: true,
      reason: 'Tankering economically viable',
      tankerAmountGallons: Math.round(optimalTankerGallons),
      tankerAmountLbs: Math.round(extraWeightLbs),
      savings: parseFloat(maxNetSavings.toFixed(2)),
      breakdown: {
        tripFuelGallons: Math.round(tripFuelGallons),
        reserveFuelGallons: Math.round(reserveFuelGallons),
        requiredFuelGallons: Math.round(requiredFuelGallons),
        maxCapacityGallons: aircraft.max_fuel_capacity_gallons,
        grossSavings: parseFloat(grossSavings.toFixed(2)),
        weightPenaltyCost: parseFloat(penaltyCost.toFixed(2)),
        extraBurnGallons: parseFloat(extraBurnGallons.toFixed(1))
      },
      fuelComparison,
      confidence: maxNetSavings >= 200 ? 'HIGH' : maxNetSavings >= 100 ? 'MEDIUM' : 'LOW'
    };
  } catch (error) {
    console.error('Error calculating tankering:', error);
    return null;
  }
}

export async function getFuelPriceHistory(airportIata, days = 30) {
  try {
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('*')
      .eq('airport_iata', airportIata)
      .gte('effective_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('effective_date', { ascending: true });

    if (error) throw error;

    return data.map(record => ({
      date: new Date(record.effective_date).toLocaleDateString(),
      pricePerGallon: parseFloat(record.price_per_gallon),
      supplier: record.supplier
    }));
  } catch (error) {
    console.error('Error fetching fuel price history:', error);
    return [];
  }
}
