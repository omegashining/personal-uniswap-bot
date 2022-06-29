import Units from 'ethereumjs-units';
import axios from "axios";

export const getEthGas = async () => {
    const result = await axios('https://ethgasstation.info/api/ethgasAPI.json?api-key=98d9f52166be2b0ec537e1703e8bc6e0a2b923e0ea75d366393950b8d290');
    const gwei = (result.data.fast / 10).toString();

    return Units.convert(gwei, 'gwei', 'wei');
}