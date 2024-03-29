import React from 'react'
import {Box, Button, Text} from "grommet";
import {Description} from "../components/Description";
import { Link } from 'react-router-dom';

export const Success = () => {
    return <Box>
        <Box direction={'row'} align={'center'} gap={'32px'}>
            <Text color={'green'}>Payment status: Success</Text>
            <Description text={`Payment was successful. Backend should receive "payment_intent.succeeded" event from Stripe.`} />
        </Box>
        <Box direction={'row'} align={'center'} gap={'32px'}>
                <Link to={'/'}>
                    <Button primary size={'large'}>
                        Back to main page
                    </Button>
                </Link>
        </Box>
    </Box>
}
