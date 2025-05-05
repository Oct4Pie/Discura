import {
    Alert,
    Box,
    Button,
    FormHelperText,
    Link,
    Paper,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography
} from '@mui/material';
import { Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { useBotStore } from '../stores/botStore';
import GridItem from '../components/GridItem';
import { Bot } from '../types';

interface BotFormValues {
  name: string;
  discordToken: string;
  applicationId: string;
  intents: string[];
}

const initialValues: BotFormValues = {
  name: '',
  discordToken: '',
  applicationId: '',
  intents: ['Guilds', 'GuildMessages', 'MessageContent']
};

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  discordToken: Yup.string().required('Bot token is required'),
  applicationId: Yup.string().required('Application ID is required')
});

const CreateBot = () => {
  const navigate = useNavigate();
  const { createBot } = useBotStore();
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = ['Create Discord App', 'Configure Bot', 'Finish Setup'];
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleSubmit = async (values: BotFormValues, formikHelpers: FormikHelpers<BotFormValues>) => {
    try {
      const bot = await createBot(values) as unknown as Bot;
      toast.success('Bot created successfully!');
      if (bot?.id) {
        navigate(`/bots/${bot.id}`);
      } else {
        navigate('/bots');
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      toast.error('Failed to create bot. Please try again.');
    } finally {
      formikHelpers.setSubmitting(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create a New Bot
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Step 1: Create a Discord Application
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Before creating a bot in Discura, you need to create a Discord application and bot account.
              </Alert>
              
              <Typography paragraph>
                Follow these steps to create your Discord bot:
              </Typography>
              
              <ol>
                <li>
                  <Typography paragraph>
                    Go to the <Link href="https://discord.com/developers/applications" target="_blank" rel="noopener">
                      Discord Developer Portal
                    </Link>
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Click on "New Application" and give it a name
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Navigate to the "Bot" tab and click "Add Bot"
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Under the "Privileged Gateway Intents" section, enable:
                    <ul>
                      <li>Server Members Intent</li>
                      <li>Message Content Intent</li>
                    </ul>
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Click "Reset Token" to generate a new token, and copy it (you'll need it in the next step)
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Copy your Application ID from the "General Information" tab
                  </Typography>
                </li>
              </ol>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              </Box>
            </Box>
          )}
          
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Step 2: Configure Your Bot
              </Typography>
              
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {(formik) => (
                  <Form>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <GridItem item xs={12}>
                        <TextField
                          fullWidth
                          id="name"
                          name="name"
                          label="Bot Name"
                          value={formik.values.name}
                          onChange={formik.handleChange}
                          error={formik.touched.name && Boolean(formik.errors.name)}
                          helperText={formik.touched.name && formik.errors.name}
                        />
                      </GridItem>
                      
                      <GridItem item xs={12}>
                        <TextField
                          fullWidth
                          id="applicationId"
                          name="applicationId"
                          label="Application ID"
                          value={formik.values.applicationId}
                          onChange={formik.handleChange}
                          error={formik.touched.applicationId && Boolean(formik.errors.applicationId)}
                          helperText={formik.touched.applicationId && formik.errors.applicationId}
                        />
                        <FormHelperText>
                          Found in your Discord application's General Information tab
                        </FormHelperText>
                      </GridItem>
                      
                      <GridItem item xs={12}>
                        <TextField
                          fullWidth
                          id="discordToken"
                          name="discordToken"
                          label="Bot Token"
                          type="password"
                          value={formik.values.discordToken}
                          onChange={formik.handleChange}
                          error={formik.touched.discordToken && Boolean(formik.errors.discordToken)}
                          helperText={formik.touched.discordToken && formik.errors.discordToken}
                        />
                        <FormHelperText>
                          Found in your Discord application's Bot tab
                        </FormHelperText>
                      </GridItem>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                      <Button 
                        variant="contained"
                        onClick={() => {
                          if (formik.isValid && (formik.dirty || formik.submitCount > 0)) {
                            // Store form values in local storage for the next step
                            localStorage.setItem('formValues', JSON.stringify(formik.values));
                            handleNext();
                          } else {
                            formik.validateForm();
                            Object.keys(formik.values).forEach(field => {
                              formik.setFieldTouched(field as any, true);
                            });
                          }
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                  </Form>
                )}
              </Formik>
            </Box>
          )}
          
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Step 3: Finish Setup
              </Typography>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                You're ready to create your Discord bot!
              </Alert>
              
              <Typography paragraph>
                After creation, you'll be able to:
              </Typography>
              
              <ul>
                <li>
                  <Typography paragraph>
                    Customize your bot's personality and behavior
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Connect it to an LLM endpoint (OpenAI, Anthropic, etc.)
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Add knowledge sources for your bot
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Enable image generation and other advanced features
                  </Typography>
                </li>
              </ul>
              
              <Typography paragraph>
                Click "Create Bot" to finish the setup process.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    const formValues = JSON.parse(localStorage.getItem('formValues') || '{}');
                    const formikHelpers: FormikHelpers<BotFormValues> = {
                      setStatus: () => {},
                      setErrors: () => {},
                      setSubmitting: () => {},
                      setTouched: () => Promise.resolve(),
                      setValues: () => Promise.resolve(),
                      setFieldError: () => {},
                      setFieldValue: () => Promise.resolve(),
                      setFieldTouched: () => Promise.resolve(),
                      validateForm: async () => ({}),
                      validateField: async () => undefined,
                      submitForm: async () => {},
                      resetForm: () => {},
                      setFormikState: () => {}
                    };
                    handleSubmit(formValues, formikHelpers);
                  }}
                >
                  Create Bot
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateBot;
