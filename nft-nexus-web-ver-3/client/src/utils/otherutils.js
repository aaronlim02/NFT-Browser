export const isValidWalletAddress = (address) => {
    if (!address || address.length !== 42) {
      return false;
    } else {
      const hexPattern = /^0x[0-9a-fA-F]+$/;
      return hexPattern.test(address);
    }
  };