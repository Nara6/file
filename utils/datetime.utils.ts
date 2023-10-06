export const currentMonth = () => {
    const currentDate = new Date();
    console.log(formatDate(currentDate));
    return {
        startDate: formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)),
        endDate: formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
}

export const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${shift(date.getMonth() + 1)}-${shift(date.getDate())} 00:00:00`;
}

const shift = (data: any) => {
    return data < 10 ? '0' + data : data;
}

export const formatDateData = (date: Date) => {
    return `${date.getFullYear()}-${shift(date.getMonth() + 1)}-${shift(date.getDate())}`;
}
